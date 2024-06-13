import type { ApiHost, Attributes, AutoExperiment, AutoExperimentVariation, ClientKey, Context, Experiment, FeatureApiResponse, FeatureDefinition, FeatureResult, LoadFeaturesOptions, RefreshFeaturesOptions, RenderFunction, Result, StickyAssignmentsDocument, SubscriptionFunction, TrackingCallback, TrackingData, WidenPrimitives, InitOptions, InitResponse, InitSyncOptions, PrefetchOptions } from "./types/growthbook";
export declare class GrowthBook<AppFeatures extends Record<string, any> = Record<string, any>> {
    private context;
    debug: boolean;
    ready: boolean;
    version: string;
    private _ctx;
    private _renderer;
    private _redirectedUrl;
    private _trackedExperiments;
    private _completedChangeIds;
    private _trackedFeatures;
    private _subscriptions;
    private _rtQueue;
    private _rtTimer;
    private _assigned;
    private _forcedFeatureValues;
    private _attributeOverrides;
    private _activeAutoExperiments;
    private _triggeredExpKeys;
    private _initialized;
    private _deferredTrackingCalls;
    private _payload;
    private _decryptedPayload;
    private _autoExperimentsAllowed;
    constructor(context?: Context);
    setPayload(payload: FeatureApiResponse): Promise<void>;
    initSync(options: InitSyncOptions): GrowthBook;
    init(options?: InitOptions): Promise<InitResponse>;
    /** @deprecated Use {@link init} */
    loadFeatures(options?: LoadFeaturesOptions): Promise<void>;
    refreshFeatures(options?: RefreshFeaturesOptions): Promise<void>;
    getApiInfo(): [ApiHost, ClientKey];
    getApiHosts(): {
        apiHost: string;
        streamingHost: string;
        apiRequestHeaders?: Record<string, string>;
        streamingHostRequestHeaders?: Record<string, string>;
    };
    getClientKey(): string;
    getPayload(): FeatureApiResponse;
    getDecryptedPayload(): FeatureApiResponse;
    isRemoteEval(): boolean;
    getCacheKeyAttributes(): (keyof Attributes)[] | undefined;
    private _refresh;
    private _render;
    /** @deprecated Use {@link setPayload} */
    setFeatures(features: Record<string, FeatureDefinition>): void;
    /** @deprecated Use {@link setPayload} */
    setEncryptedFeatures(encryptedString: string, decryptionKey?: string, subtle?: SubtleCrypto): Promise<void>;
    /** @deprecated Use {@link setPayload} */
    setExperiments(experiments: AutoExperiment[]): void;
    /** @deprecated Use {@link setPayload} */
    setEncryptedExperiments(encryptedString: string, decryptionKey?: string, subtle?: SubtleCrypto): Promise<void>;
    decryptPayload(data: FeatureApiResponse, decryptionKey?: string, subtle?: SubtleCrypto): Promise<FeatureApiResponse>;
    setAttributes(attributes: Attributes): Promise<void>;
    updateAttributes(attributes: Attributes): Promise<void>;
    setAttributeOverrides(overrides: Attributes): Promise<void>;
    setForcedVariations(vars: Record<string, number>): Promise<void>;
    setForcedFeatures(map: Map<string, any>): void;
    setURL(url: string): Promise<void>;
    getAttributes(): {
        [x: string]: any;
    };
    getForcedVariations(): Record<string, number>;
    getForcedFeatures(): Map<string, any>;
    getStickyBucketAssignmentDocs(): Record<string, StickyAssignmentsDocument>;
    getUrl(): string;
    getFeatures(): Record<string, FeatureDefinition<any>>;
    getExperiments(): AutoExperiment<AutoExperimentVariation>[];
    getCompletedChangeIds(): string[];
    subscribe(cb: SubscriptionFunction): () => void;
    private _canSubscribe;
    private _refreshForRemoteEval;
    getAllResults(): Map<string, {
        experiment: Experiment<any>;
        result: Result<any>;
    }>;
    destroy(): void;
    setRenderer(renderer: null | RenderFunction): void;
    forceVariation(key: string, variation: number): void;
    run<T>(experiment: Experiment<T>): Result<T>;
    triggerExperiment(key: string): (Result<AutoExperimentVariation> | null)[] | null;
    triggerAutoExperiments(): void;
    private _runAutoExperiment;
    private _undoActiveAutoExperiment;
    private _updateAllAutoExperiments;
    private _fireSubscriptions;
    private _trackFeatureUsage;
    private _getFeatureResult;
    isOn<K extends string & keyof AppFeatures = string>(key: K): boolean;
    isOff<K extends string & keyof AppFeatures = string>(key: K): boolean;
    getFeatureValue<V extends AppFeatures[K], K extends string & keyof AppFeatures = string>(key: K, defaultValue: V): WidenPrimitives<V>;
    /**
     * @deprecated Use {@link evalFeature}
     * @param id
     */
    feature<V extends AppFeatures[K], K extends string & keyof AppFeatures = string>(id: K): FeatureResult<V | null>;
    evalFeature<V extends AppFeatures[K], K extends string & keyof AppFeatures = string>(id: K): FeatureResult<V | null>;
    private _evalFeature;
    private _isIncludedInRollout;
    private _conditionPasses;
    private _isFilteredOut;
    private _run;
    log(msg: string, ctx: Record<string, unknown>): void;
    getDeferredTrackingCalls(): TrackingData[];
    setDeferredTrackingCalls(calls: TrackingData[]): void;
    fireDeferredTrackingCalls(): void;
    setTrackingCallback(callback: TrackingCallback): void;
    private _getTrackKey;
    private _track;
    private _mergeOverrides;
    private _getHashAttribute;
    private _getResult;
    private _getContextUrl;
    private _urlIsValid;
    private _hasGroupOverlap;
    private _isAutoExperimentBlockedByContext;
    getRedirectUrl(): string;
    private _getNavigateFunction;
    private _setAntiFlicker;
    private _applyDOMChanges;
    private _deriveStickyBucketIdentifierAttributes;
    refreshStickyBuckets(data?: FeatureApiResponse): Promise<void>;
    private _getStickyBucketAssignments;
    private _getStickyBucketVariation;
    private _getStickyBucketExperimentKey;
    private _getStickyBucketAttributes;
    private _generateStickyBucketAssignmentDoc;
}
export declare function prefetchPayload(options: PrefetchOptions): Promise<void>;
//# sourceMappingURL=GrowthBook.d.ts.map