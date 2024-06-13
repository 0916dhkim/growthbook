"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearCache = clearCache;
exports.configureCache = configureCache;
exports.helpers = void 0;
exports.onHidden = onHidden;
exports.onVisible = onVisible;
exports.refreshFeatures = refreshFeatures;
exports.setPolyfills = setPolyfills;
exports.startAutoRefresh = startAutoRefresh;
exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
var _util = require("./util");
// Config settings
const cacheSettings = {
  // Consider a fetch stale after 1 minute
  staleTTL: 1000 * 60,
  // Max time to keep a fetch in cache (24 hours default)
  maxAge: 1000 * 60 * 60 * 24,
  cacheKey: "gbFeaturesCache",
  backgroundSync: true,
  maxEntries: 10,
  disableIdleStreams: false,
  idleStreamInterval: 20000,
  disableCache: false
};
const polyfills = (0, _util.getPolyfills)();
const helpers = {
  fetchFeaturesCall: _ref => {
    let {
      host,
      clientKey,
      headers
    } = _ref;
    return polyfills.fetch("".concat(host, "/api/features/").concat(clientKey), {
      headers
    });
  },
  fetchRemoteEvalCall: _ref2 => {
    let {
      host,
      clientKey,
      payload,
      headers
    } = _ref2;
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify(payload)
    };
    return polyfills.fetch("".concat(host, "/api/eval/").concat(clientKey), options);
  },
  eventSourceCall: _ref3 => {
    let {
      host,
      clientKey,
      headers
    } = _ref3;
    if (headers) {
      return new polyfills.EventSource("".concat(host, "/sub/").concat(clientKey), {
        headers
      });
    }
    return new polyfills.EventSource("".concat(host, "/sub/").concat(clientKey));
  },
  startIdleListener: () => {
    let idleTimeout;
    const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
    if (!isBrowser) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        window.clearTimeout(idleTimeout);
        onVisible();
      } else if (document.visibilityState === "hidden") {
        idleTimeout = window.setTimeout(onHidden, cacheSettings.idleStreamInterval);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  },
  stopIdleListener: () => {
    // No-op, replaced by startIdleListener
  }
};
exports.helpers = helpers;
try {
  if (globalThis.localStorage) {
    polyfills.localStorage = globalThis.localStorage;
  }
} catch (e) {
  // Ignore localStorage errors
}

// Global state
const subscribedInstances = new Map();
let cacheInitialized = false;
const cache = new Map();
const activeFetches = new Map();
const streams = new Map();
const supportsSSE = new Set();

// Public functions
function setPolyfills(overrides) {
  Object.assign(polyfills, overrides);
}
function configureCache(overrides) {
  Object.assign(cacheSettings, overrides);
  if (!cacheSettings.backgroundSync) {
    clearAutoRefresh();
  }
}
async function clearCache() {
  cache.clear();
  activeFetches.clear();
  clearAutoRefresh();
  cacheInitialized = false;
  await updatePersistentCache();
}

// Get or fetch features and refresh the SDK instance
async function refreshFeatures(_ref4) {
  let {
    instance,
    timeout,
    skipCache,
    allowStale,
    backgroundSync
  } = _ref4;
  if (!backgroundSync) {
    cacheSettings.backgroundSync = false;
  }
  return fetchFeaturesWithCache({
    instance,
    allowStale,
    timeout,
    skipCache
  });
}

// Subscribe a GrowthBook instance to feature changes
function subscribe(instance) {
  const key = getKey(instance);
  const subs = subscribedInstances.get(key) || new Set();
  subs.add(instance);
  subscribedInstances.set(key, subs);
}
function unsubscribe(instance) {
  subscribedInstances.forEach(s => s.delete(instance));
}
function onHidden() {
  streams.forEach(channel => {
    if (!channel) return;
    channel.state = "idle";
    disableChannel(channel);
  });
}
function onVisible() {
  streams.forEach(channel => {
    if (!channel) return;
    if (channel.state !== "idle") return;
    enableChannel(channel);
  });
}

// Private functions

async function updatePersistentCache() {
  try {
    if (!polyfills.localStorage) return;
    await polyfills.localStorage.setItem(cacheSettings.cacheKey, JSON.stringify(Array.from(cache.entries())));
  } catch (e) {
    // Ignore localStorage errors
  }
}

// SWR wrapper for fetching features. May indirectly or directly start SSE streaming.
async function fetchFeaturesWithCache(_ref5) {
  let {
    instance,
    allowStale,
    timeout,
    skipCache
  } = _ref5;
  const key = getKey(instance);
  const cacheKey = getCacheKey(instance);
  const now = new Date();
  const minStaleAt = new Date(now.getTime() - cacheSettings.maxAge + cacheSettings.staleTTL);
  await initializeCache();
  const existing = !cacheSettings.disableCache && !skipCache ? cache.get(cacheKey) : undefined;
  if (existing && (allowStale || existing.staleAt > now) && existing.staleAt > minStaleAt) {
    // Restore from cache whether SSE is supported
    if (existing.sse) supportsSSE.add(key);

    // Reload features in the background if stale
    if (existing.staleAt < now) {
      fetchFeatures(instance);
    }
    // Otherwise, if we don't need to refresh now, start a background sync
    else {
      startAutoRefresh(instance);
    }
    return {
      data: existing.data,
      success: true,
      source: "cache"
    };
  } else {
    const res = await promiseTimeout(fetchFeatures(instance), timeout);
    return res || {
      data: null,
      success: false,
      source: "timeout",
      error: new Error("Timeout")
    };
  }
}
function getKey(instance) {
  const [apiHost, clientKey] = instance.getApiInfo();
  return "".concat(apiHost, "||").concat(clientKey);
}
function getCacheKey(instance) {
  const baseKey = getKey(instance);
  if (!instance.isRemoteEval()) return baseKey;
  const attributes = instance.getAttributes();
  const cacheKeyAttributes = instance.getCacheKeyAttributes() || Object.keys(instance.getAttributes());
  const ca = {};
  cacheKeyAttributes.forEach(key => {
    ca[key] = attributes[key];
  });
  const fv = instance.getForcedVariations();
  const url = instance.getUrl();
  return "".concat(baseKey, "||").concat(JSON.stringify({
    ca,
    fv,
    url
  }));
}

// Guarantee the promise always resolves within {timeout} ms
// Resolved value will be `null` when there's an error or it takes too long
// Note: The promise will continue running in the background, even if the timeout is hit
function promiseTimeout(promise, timeout) {
  return new Promise(resolve => {
    let resolved = false;
    let timer;
    const finish = data => {
      if (resolved) return;
      resolved = true;
      timer && clearTimeout(timer);
      resolve(data || null);
    };
    if (timeout) {
      timer = setTimeout(() => finish(), timeout);
    }
    promise.then(data => finish(data)).catch(() => finish());
  });
}

// Populate cache from localStorage (if available)
async function initializeCache() {
  if (cacheInitialized) return;
  cacheInitialized = true;
  try {
    if (polyfills.localStorage) {
      const value = await polyfills.localStorage.getItem(cacheSettings.cacheKey);
      if (!cacheSettings.disableCache && value) {
        const parsed = JSON.parse(value);
        if (parsed && Array.isArray(parsed)) {
          parsed.forEach(_ref6 => {
            let [key, data] = _ref6;
            cache.set(key, {
              ...data,
              staleAt: new Date(data.staleAt)
            });
          });
        }
        cleanupCache();
      }
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  if (!cacheSettings.disableIdleStreams) {
    const cleanupFn = helpers.startIdleListener();
    if (cleanupFn) {
      helpers.stopIdleListener = cleanupFn;
    }
  }
}

// Enforce the maxEntries limit
function cleanupCache() {
  const entriesWithTimestamps = Array.from(cache.entries()).map(_ref7 => {
    let [key, value] = _ref7;
    return {
      key,
      staleAt: value.staleAt.getTime()
    };
  }).sort((a, b) => a.staleAt - b.staleAt);
  const entriesToRemoveCount = Math.min(Math.max(0, cache.size - cacheSettings.maxEntries), cache.size);
  for (let i = 0; i < entriesToRemoveCount; i++) {
    cache.delete(entriesWithTimestamps[i].key);
  }
}

// Called whenever new features are fetched from the API
function onNewFeatureData(key, cacheKey, data) {
  // If contents haven't changed, ignore the update, extend the stale TTL
  const version = data.dateUpdated || "";
  const staleAt = new Date(Date.now() + cacheSettings.staleTTL);
  const existing = !cacheSettings.disableCache ? cache.get(cacheKey) : undefined;
  if (existing && version && existing.version === version) {
    existing.staleAt = staleAt;
    updatePersistentCache();
    return;
  }
  if (!cacheSettings.disableCache) {
    // Update in-memory cache
    cache.set(cacheKey, {
      data,
      version,
      staleAt,
      sse: supportsSSE.has(key)
    });
    cleanupCache();
  }
  // Update local storage (don't await this, just update asynchronously)
  updatePersistentCache();

  // Update features for all subscribed GrowthBook instances
  const instances = subscribedInstances.get(key);
  instances && instances.forEach(instance => refreshInstance(instance, data));
}
async function refreshInstance(instance, data) {
  await instance.setPayload(data || instance.getPayload());
}

// Fetch the features payload from helper function or from in-mem injected payload
async function fetchFeatures(instance) {
  const {
    apiHost,
    apiRequestHeaders
  } = instance.getApiHosts();
  const clientKey = instance.getClientKey();
  const remoteEval = instance.isRemoteEval();
  const key = getKey(instance);
  const cacheKey = getCacheKey(instance);
  let promise = activeFetches.get(cacheKey);
  if (!promise) {
    const fetcher = remoteEval ? helpers.fetchRemoteEvalCall({
      host: apiHost,
      clientKey,
      payload: {
        attributes: instance.getAttributes(),
        forcedVariations: instance.getForcedVariations(),
        forcedFeatures: Array.from(instance.getForcedFeatures().entries()),
        url: instance.getUrl()
      },
      headers: apiRequestHeaders
    }) : helpers.fetchFeaturesCall({
      host: apiHost,
      clientKey,
      headers: apiRequestHeaders
    });

    // TODO: auto-retry if status code indicates a temporary error
    promise = fetcher.then(res => {
      if (!res.ok) {
        throw new Error("HTTP error: ".concat(res.status));
      }
      if (res.headers.get("x-sse-support") === "enabled") {
        supportsSSE.add(key);
      }
      return res.json();
    }).then(data => {
      onNewFeatureData(key, cacheKey, data);
      startAutoRefresh(instance);
      activeFetches.delete(cacheKey);
      return {
        data,
        success: true,
        source: "network"
      };
    }).catch(e => {
      process.env.NODE_ENV !== "production" && instance.log("Error fetching features", {
        apiHost,
        clientKey,
        error: e ? e.message : null
      });
      activeFetches.delete(cacheKey);
      return {
        data: null,
        source: "error",
        success: false,
        error: e
      };
    });
    activeFetches.set(cacheKey, promise);
  }
  return promise;
}

// Start SSE streaming, listens to feature payload changes and triggers a refresh or re-fetch
function startAutoRefresh(instance) {
  let forceSSE = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  const key = getKey(instance);
  const cacheKey = getCacheKey(instance);
  const {
    streamingHost,
    streamingHostRequestHeaders
  } = instance.getApiHosts();
  const clientKey = instance.getClientKey();
  if (forceSSE) {
    supportsSSE.add(key);
  }
  if (cacheSettings.backgroundSync && supportsSSE.has(key) && polyfills.EventSource) {
    if (streams.has(key)) return;
    const channel = {
      src: null,
      host: streamingHost,
      clientKey,
      headers: streamingHostRequestHeaders,
      cb: event => {
        try {
          if (event.type === "features-updated") {
            const instances = subscribedInstances.get(key);
            instances && instances.forEach(instance => {
              fetchFeatures(instance);
            });
          } else if (event.type === "features") {
            const json = JSON.parse(event.data);
            onNewFeatureData(key, cacheKey, json);
          }
          // Reset error count on success
          channel.errors = 0;
        } catch (e) {
          process.env.NODE_ENV !== "production" && instance.log("SSE Error", {
            streamingHost,
            clientKey,
            error: e ? e.message : null
          });
          onSSEError(channel);
        }
      },
      errors: 0,
      state: "active"
    };
    streams.set(key, channel);
    enableChannel(channel);
  }
}
function onSSEError(channel) {
  if (channel.state === "idle") return;
  channel.errors++;
  if (channel.errors > 3 || channel.src && channel.src.readyState === 2) {
    // exponential backoff after 4 errors, with jitter
    const delay = Math.pow(3, channel.errors - 3) * (1000 + Math.random() * 1000);
    disableChannel(channel);
    setTimeout(() => {
      if (["idle", "active"].includes(channel.state)) return;
      enableChannel(channel);
    }, Math.min(delay, 300000)); // 5 minutes max
  }
}

function disableChannel(channel) {
  if (!channel.src) return;
  channel.src.onopen = null;
  channel.src.onerror = null;
  channel.src.close();
  channel.src = null;
  if (channel.state === "active") {
    channel.state = "disabled";
  }
}
function enableChannel(channel) {
  channel.src = helpers.eventSourceCall({
    host: channel.host,
    clientKey: channel.clientKey,
    headers: channel.headers
  });
  channel.state = "active";
  channel.src.addEventListener("features", channel.cb);
  channel.src.addEventListener("features-updated", channel.cb);
  channel.src.onerror = () => onSSEError(channel);
  channel.src.onopen = () => {
    channel.errors = 0;
  };
}
function destroyChannel(channel, key) {
  disableChannel(channel);
  streams.delete(key);
}
function clearAutoRefresh() {
  // Clear list of which keys are auto-updated
  supportsSSE.clear();

  // Stop listening for any SSE events
  streams.forEach(destroyChannel);

  // Remove all references to GrowthBook instances
  subscribedInstances.clear();

  // Run the idle stream cleanup function
  helpers.stopIdleListener();
}
//# sourceMappingURL=feature-repository.js.map