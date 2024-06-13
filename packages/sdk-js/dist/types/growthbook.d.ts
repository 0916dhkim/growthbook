import type { GrowthBook, StickyBucketService } from "..";
import { ConditionInterface, ParentConditionInterface } from "./mongrule";
declare global {
    interface Window {
        _growthbook?: GrowthBook;
    }
}
export type VariationMeta = {
    passthrough?: boolean;
    key?: string;
    name?: string;
};
export type FeatureRule<T = any> = {
    id?: string;
    condition?: ConditionInterface;
    parentConditions?: ParentConditionInterface[];
    force?: T;
    variations?: T[];
    weights?: number[];
    key?: string;
    hashAttribute?: string;
    fallbackAttribute?: string;
    hashVersion?: number;
    disableStickyBucketing?: boolean;
    bucketVersion?: number;
    minBucketVersion?: number;
    range?: VariationRange;
    coverage?: number;
    /** @deprecated */
    namespace?: [string, number, number];
    ranges?: VariationRange[];
    meta?: VariationMeta[];
    filters?: Filter[];
    seed?: string;
    name?: string;
    phase?: string;
    tracks?: Array<{
        experiment: Experiment<T>;
        result: Result<T>;
    }>;
};
export interface FeatureDefinition<T = any> {
    defaultValue?: T;
    rules?: FeatureRule<T>[];
}
export type FeatureResultSource = "unknownFeature" | "defaultValue" | "force" | "override" | "experiment" | "prerequisite" | "cyclicPrerequisite";
export interface FeatureResult<T = any> {
    value: T | null;
    source: FeatureResultSource;
    on: boolean;
    off: boolean;
    ruleId: string;
    experiment?: Experiment<T>;
    experimentResult?: Result<T>;
}
/** @deprecated */
export type ExperimentStatus = "draft" | "running" | "stopped";
export type UrlTargetType = "regex" | "simple";
export type UrlTarget = {
    include: boolean;
    type: UrlTargetType;
    pattern: string;
};
export type Experiment<T> = {
    key: string;
    variations: [T, T, ...T[]];
    ranges?: VariationRange[];
    meta?: VariationMeta[];
    filters?: Filter[];
    seed?: string;
    name?: string;
    phase?: string;
    urlPatterns?: UrlTarget[];
    weights?: number[];
    condition?: ConditionInterface;
    parentConditions?: ParentConditionInterface[];
    coverage?: number;
    include?: () => boolean;
    /** @deprecated */
    namespace?: [string, number, number];
    force?: number;
    hashAttribute?: string;
    fallbackAttribute?: string;
    hashVersion?: number;
    disableStickyBucketing?: boolean;
    bucketVersion?: number;
    minBucketVersion?: number;
    active?: boolean;
    persistQueryString?: boolean;
    /** @deprecated */
    status?: ExperimentStatus;
    /** @deprecated */
    url?: RegExp;
    /** @deprecated */
    groups?: string[];
};
export type AutoExperimentChangeType = "redirect" | "visual" | "unknown";
export type AutoExperiment<T = AutoExperimentVariation> = Experiment<T> & {
    changeId?: string;
    manual?: boolean;
};
export type ExperimentOverride = {
    condition?: ConditionInterface;
    weights?: number[];
    active?: boolean;
    status?: ExperimentStatus;
    force?: number;
    coverage?: number;
    groups?: string[];
    namespace?: [string, number, number];
    url?: RegExp | string;
};
export interface Result<T> {
    value: T;
    variationId: number;
    key: string;
    name?: string;
    bucket?: number;
    passthrough?: boolean;
    inExperiment: boolean;
    hashUsed?: boolean;
    hashAttribute: string;
    hashValue: string;
    featureId: string | null;
    stickyBucketUsed?: boolean;
}
export type Attributes = Record<string, any>;
export type RealtimeUsageData = {
    key: string;
    on: boolean;
};
export interface TrackingData {
    experiment: Experiment<any>;
    result: Result<any>;
}
export type TrackingCallback = (experiment: Experiment<any>, result: Result<any>) => void;
export type NavigateCallback = (url: string) => void | Promise<void>;
export type ApplyDomChangesCallback = (changes: AutoExperimentVariation) => () => void;
export type RenderFunction = () => void;
export interface Context {
    enabled?: boolean;
    attributes?: Attributes;
    url?: string;
    features?: Record<string, FeatureDefinition>;
    experiments?: AutoExperiment[];
    forcedVariations?: Record<string, number>;
    blockedChangeIds?: string[];
    disableVisualExperiments?: boolean;
    disableJsInjection?: boolean;
    jsInjectionNonce?: string;
    disableUrlRedirectExperiments?: boolean;
    disableCrossOriginUrlRedirectExperiments?: boolean;
    disableExperimentsOnLoad?: boolean;
    stickyBucketAssignmentDocs?: Record<StickyAttributeKey, StickyAssignmentsDocument>;
    stickyBucketIdentifierAttributes?: string[];
    stickyBucketService?: StickyBucketService;
    debug?: boolean;
    log?: (msg: string, ctx: any) => void;
    qaMode?: boolean;
    /** @deprecated */
    backgroundSync?: boolean;
    /** @deprecated */
    subscribeToChanges?: boolean;
    enableDevMode?: boolean;
    disableCache?: boolean;
    /** @deprecated */
    disableDevTools?: boolean;
    trackingCallback?: TrackingCallback;
    onFeatureUsage?: (key: string, result: FeatureResult<any>) => void;
    /** @deprecated */
    realtimeKey?: string;
    /** @deprecated */
    realtimeInterval?: number;
    cacheKeyAttributes?: (keyof Attributes)[];
    /** @deprecated */
    user?: {
        id?: string;
        anonId?: string;
        [key: string]: string | undefined;
    };
    /** @deprecated */
    overrides?: Record<string, ExperimentOverride>;
    /** @deprecated */
    groups?: Record<string, boolean>;
    apiHost?: string;
    streamingHost?: string;
    apiHostRequestHeaders?: Record<string, string>;
    streamingHostRequestHeaders?: Record<string, string>;
    clientKey?: string;
    renderer?: null | RenderFunction;
    decryptionKey?: string;
    remoteEval?: boolean;
    navigate?: NavigateCallback;
    navigateDelay?: number;
    antiFlicker?: boolean;
    antiFlickerTimeout?: number;
    applyDomChangesCallback?: ApplyDomChangesCallback;
}
export type PrefetchOptions = Pick<Context, "decryptionKey" | "apiHost" | "apiHostRequestHeaders" | "streamingHost" | "streamingHostRequestHeaders"> & {
    clientKey: string;
    streaming?: boolean;
    skipCache?: boolean;
};
export type SubscriptionFunction = (experiment: Experiment<any>, result: Result<any>) => void;
export type VariationRange = [number, number];
export interface InitResponse {
    success: boolean;
    source: "init" | "cache" | "network" | "error" | "timeout";
    error?: Error;
}
export interface FetchResponse {
    data: FeatureApiResponse | null;
    success: boolean;
    source: "cache" | "network" | "error" | "timeout";
    error?: Error;
}
export type JSONValue = null | number | string | boolean | Array<JSONValue> | Record<string, unknown> | {
    [key: string]: JSONValue;
};
export type WidenPrimitives<T> = T extends string ? string : T extends number ? number : T extends boolean ? boolean : T;
export type FeatureEvalContext = {
    id?: string;
    evaluatedFeatures: Set<string>;
};
export type DOMMutation = {
    selector: string;
    action: string;
    attribute: string;
    value?: string;
    parentSelector?: string;
    insertBeforeSelector?: string;
};
export type AutoExperimentVariation = {
    domMutations?: DOMMutation[];
    css?: string;
    js?: string;
    urlRedirect?: string;
};
export type FeatureDefinitions = Record<string, FeatureDefinition>;
export type FeatureApiResponse = {
    features?: FeatureDefinitions;
    dateUpdated?: string;
    encryptedFeatures?: string;
    experiments?: AutoExperiment[];
    encryptedExperiments?: string;
};
export type GrowthBookPayload = FeatureApiResponse;
export type Polyfills = {
    fetch: any;
    SubtleCrypto: any;
    EventSource: any;
    localStorage?: LocalStorageCompat;
};
export type Helpers = {
    fetchFeaturesCall: ({ host, clientKey, headers, }: {
        host: string;
        clientKey: string;
        headers?: Record<string, string>;
    }) => Promise<Response>;
    fetchRemoteEvalCall: ({ host, clientKey, payload, headers, }: {
        host: string;
        clientKey: string;
        payload: any;
        headers?: Record<string, string>;
    }) => Promise<Response>;
    eventSourceCall: ({ host, clientKey, headers, }: {
        host: string;
        clientKey: string;
        headers?: Record<string, string>;
    }) => EventSource;
    startIdleListener: () => (() => void) | void;
    stopIdleListener: () => void;
};
export interface LocalStorageCompat {
    getItem(key: string): string | null | Promise<string | null>;
    setItem(key: string, value: string): void | Promise<void>;
}
export type CacheSettings = {
    backgroundSync: boolean;
    cacheKey: string;
    staleTTL: number;
    maxAge: number;
    maxEntries: number;
    disableIdleStreams: boolean;
    idleStreamInterval: number;
    disableCache: boolean;
};
export type ApiHost = string;
export type ClientKey = string;
export type InitOptions = {
    timeout?: number;
    skipCache?: boolean;
    payload?: FeatureApiResponse;
    streaming?: boolean;
};
export type InitSyncOptions = {
    payload: FeatureApiResponse;
    streaming?: boolean;
};
export type LoadFeaturesOptions = {
    /** @deprecated */
    autoRefresh?: boolean;
    timeout?: number;
    skipCache?: boolean;
};
export type RefreshFeaturesOptions = {
    timeout?: number;
    skipCache?: boolean;
};
export interface Filter {
    attribute?: string;
    seed: string;
    hashVersion: number;
    ranges: VariationRange[];
}
export type StickyAttributeKey = string;
export type StickyExperimentKey = string;
export type StickyAssignments = Record<StickyExperimentKey, string>;
export interface StickyAssignmentsDocument {
    attributeName: string;
    attributeValue: string;
    assignments: StickyAssignments;
}
//# sourceMappingURL=growthbook.d.ts.map