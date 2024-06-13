import { CacheSettings, FetchResponse, Helpers, Polyfills } from "./types/growthbook";
import type { GrowthBook } from ".";
export declare const helpers: Helpers;
export declare function setPolyfills(overrides: Partial<Polyfills>): void;
export declare function configureCache(overrides: Partial<CacheSettings>): void;
export declare function clearCache(): Promise<void>;
export declare function refreshFeatures({ instance, timeout, skipCache, allowStale, backgroundSync, }: {
    instance: GrowthBook;
    timeout?: number;
    skipCache?: boolean;
    allowStale?: boolean;
    backgroundSync?: boolean;
}): Promise<FetchResponse>;
export declare function subscribe(instance: GrowthBook): void;
export declare function unsubscribe(instance: GrowthBook): void;
export declare function onHidden(): void;
export declare function onVisible(): void;
export declare function startAutoRefresh(instance: GrowthBook, forceSSE?: boolean): void;
//# sourceMappingURL=feature-repository.d.ts.map