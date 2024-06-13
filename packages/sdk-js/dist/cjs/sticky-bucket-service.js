"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.StickyBucketService = exports.RedisStickyBucketService = exports.LocalStorageStickyBucketService = exports.ExpressCookieStickyBucketService = exports.BrowserCookieStickyBucketService = void 0;
/**
 * Responsible for reading and writing documents which describe sticky bucket assignments.
 */
class StickyBucketService {
  /**
   * The SDK calls getAllAssignments to populate sticky buckets. This in turn will
   * typically loop through individual getAssignments calls. However, some StickyBucketService
   * instances (i.e. Redis) will instead perform a multi-query inside getAllAssignments instead.
   */
  async getAllAssignments(attributes) {
    const docs = {};
    (await Promise.all(Object.entries(attributes).map(_ref => {
      let [attributeName, attributeValue] = _ref;
      return this.getAssignments(attributeName, attributeValue);
    }))).forEach(doc => {
      if (doc) {
        const key = "".concat(doc.attributeName, "||").concat(doc.attributeValue);
        docs[key] = doc;
      }
    });
    return docs;
  }
}
exports.StickyBucketService = StickyBucketService;
class LocalStorageStickyBucketService extends StickyBucketService {
  constructor(opts) {
    opts = opts || {};
    super();
    this.prefix = opts.prefix || "gbStickyBuckets__";
    try {
      this.localStorage = opts.localStorage || globalThis.localStorage;
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  async getAssignments(attributeName, attributeValue) {
    const key = "".concat(attributeName, "||").concat(attributeValue);
    let doc = null;
    if (!this.localStorage) return doc;
    try {
      const raw = (await this.localStorage.getItem(this.prefix + key)) || "{}";
      const data = JSON.parse(raw);
      if (data.attributeName && data.attributeValue && data.assignments) {
        doc = data;
      }
    } catch (e) {
      // Ignore localStorage errors
    }
    return doc;
  }
  async saveAssignments(doc) {
    const key = "".concat(doc.attributeName, "||").concat(doc.attributeValue);
    if (!this.localStorage) return;
    try {
      await this.localStorage.setItem(this.prefix + key, JSON.stringify(doc));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}
exports.LocalStorageStickyBucketService = LocalStorageStickyBucketService;
class ExpressCookieStickyBucketService extends StickyBucketService {
  /**
   * Intended to be used with cookieParser() middleware from npm: 'cookie-parser'.
   * Assumes:
   *  - reading a cookie is automatically decoded via decodeURIComponent() or similar
   *  - writing a cookie name & value must be manually encoded via encodeURIComponent() or similar
   *  - all cookie bodies are JSON encoded strings and are manually encoded/decoded
   */

  constructor(_ref2) {
    let {
      prefix = "gbStickyBuckets__",
      req,
      res,
      cookieAttributes = {}
    } = _ref2;
    super();
    this.prefix = prefix;
    this.req = req;
    this.res = res;
    this.cookieAttributes = cookieAttributes;
  }
  async getAssignments(attributeName, attributeValue) {
    const key = "".concat(attributeName, "||").concat(attributeValue);
    let doc = null;
    if (!this.req) return doc;
    try {
      const raw = this.req.cookies[this.prefix + key] || "{}";
      const data = JSON.parse(raw);
      if (data.attributeName && data.attributeValue && data.assignments) {
        doc = data;
      }
    } catch (e) {
      // Ignore cookie errors
    }
    return doc;
  }
  async saveAssignments(doc) {
    const key = "".concat(doc.attributeName, "||").concat(doc.attributeValue);
    if (!this.res) return;
    const str = JSON.stringify(doc);
    this.res.cookie(encodeURIComponent(this.prefix + key), encodeURIComponent(str), this.cookieAttributes);
  }
}
exports.ExpressCookieStickyBucketService = ExpressCookieStickyBucketService;
class BrowserCookieStickyBucketService extends StickyBucketService {
  /**
   * Intended to be used with npm: 'js-cookie'.
   * Assumes:
   *  - reading a cookie is automatically decoded via decodeURIComponent() or similar
   *  - writing a cookie name & value is automatically encoded via encodeURIComponent() or similar
   *  - all cookie bodies are JSON encoded strings and are manually encoded/decoded
   */

  constructor(_ref3) {
    let {
      prefix = "gbStickyBuckets__",
      jsCookie,
      cookieAttributes = {}
    } = _ref3;
    super();
    this.prefix = prefix;
    this.jsCookie = jsCookie;
    this.cookieAttributes = cookieAttributes;
  }
  async getAssignments(attributeName, attributeValue) {
    const key = "".concat(attributeName, "||").concat(attributeValue);
    let doc = null;
    if (!this.jsCookie) return doc;
    try {
      const raw = this.jsCookie.get(this.prefix + key);
      const data = JSON.parse(raw || "{}");
      if (data.attributeName && data.attributeValue && data.assignments) {
        doc = data;
      }
    } catch (e) {
      // Ignore cookie errors
    }
    return doc;
  }
  async saveAssignments(doc) {
    const key = "".concat(doc.attributeName, "||").concat(doc.attributeValue);
    if (!this.jsCookie) return;
    const str = JSON.stringify(doc);
    this.jsCookie.set(this.prefix + key, str, this.cookieAttributes);
  }
}
exports.BrowserCookieStickyBucketService = BrowserCookieStickyBucketService;
class RedisStickyBucketService extends StickyBucketService {
  /** Intended to be used with npm: 'ioredis'. **/

  constructor(_ref4) {
    let {
      redis
    } = _ref4;
    super();
    this.redis = redis;
  }
  async getAllAssignments(attributes) {
    const docs = {};
    const keys = Object.entries(attributes).map(_ref5 => {
      let [attributeName, attributeValue] = _ref5;
      return "".concat(attributeName, "||").concat(attributeValue);
    });
    if (!this.redis) return docs;
    await this.redis.mget(...keys).then(values => {
      values.forEach(raw => {
        try {
          const data = JSON.parse(raw || "{}");
          if (data.attributeName && data.attributeValue && data.assignments) {
            const key = "".concat(data.attributeName, "||").concat(data.attributeValue);
            docs[key] = data;
          }
        } catch (e) {
          // ignore redis doc parse errors
        }
      });
    });
    return docs;
  }
  async getAssignments(_attributeName, _attributeValue) {
    // not implemented
    return null;
  }
  async saveAssignments(doc) {
    const key = "".concat(doc.attributeName, "||").concat(doc.attributeValue);
    if (!this.redis) return;
    await this.redis.set(key, JSON.stringify(doc));
  }
}
exports.RedisStickyBucketService = RedisStickyBucketService;
//# sourceMappingURL=sticky-bucket-service.js.map