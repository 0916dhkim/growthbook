import { Context, FeatureApiResponse, GrowthBook } from "./index";
type WindowContext = Context & {
    uuidCookieName?: string;
    uuidKey?: string;
    uuid?: string;
    persistUuidOnLoad?: boolean;
    noStreaming?: boolean;
    useStickyBucketService?: "cookie" | "localStorage";
    stickyBucketPrefix?: string;
    payload?: FeatureApiResponse;
};
declare global {
    interface Window {
        _growthbook?: GrowthBook;
        growthbook_queue?: Array<(gb: GrowthBook) => void> | {
            push: (cb: (gb: GrowthBook) => void) => void;
        };
        growthbook_config?: WindowContext;
        dataLayer?: any[];
        analytics?: {
            track?: (name: string, props?: Record<string, unknown>) => void;
        };
        gtag?: (...args: any) => void;
    }
}
declare const gb: GrowthBook<Record<string, any>>;
export default gb;
//# sourceMappingURL=auto-wrapper.d.ts.map