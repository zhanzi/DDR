export declare const DDRReport: import("vue").DefineComponent<import("vue").ExtractPropTypes<{
    config: {
        type: (StringConstructor | ObjectConstructor)[];
        required: true;
    };
    theme: {
        type: StringConstructor;
        default: string;
    };
    mode: {
        type: StringConstructor;
        default: string;
    };
    lang: {
        type: StringConstructor;
        default: string;
    };
    metadata: {
        type: ObjectConstructor;
        default: () => {};
    };
    debug: {
        type: BooleanConstructor;
        default: boolean;
    };
}>, {
    containerRef: import("vue").Ref<HTMLElement | null, HTMLElement | null>;
}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, ("data-loaded" | "render-complete" | "export-start" | "export-complete" | "metadata-updated" | "error")[], "data-loaded" | "render-complete" | "export-start" | "export-complete" | "metadata-updated" | "error", import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    config: {
        type: (StringConstructor | ObjectConstructor)[];
        required: true;
    };
    theme: {
        type: StringConstructor;
        default: string;
    };
    mode: {
        type: StringConstructor;
        default: string;
    };
    lang: {
        type: StringConstructor;
        default: string;
    };
    metadata: {
        type: ObjectConstructor;
        default: () => {};
    };
    debug: {
        type: BooleanConstructor;
        default: boolean;
    };
}>> & Readonly<{
    onError?: ((...args: any[]) => any) | undefined;
    "onData-loaded"?: ((...args: any[]) => any) | undefined;
    "onRender-complete"?: ((...args: any[]) => any) | undefined;
    "onExport-start"?: ((...args: any[]) => any) | undefined;
    "onExport-complete"?: ((...args: any[]) => any) | undefined;
    "onMetadata-updated"?: ((...args: any[]) => any) | undefined;
}>, {
    metadata: Record<string, any>;
    theme: string;
    mode: string;
    lang: string;
    debug: boolean;
}, {}, {}, {}, string, import("vue").ComponentProvideOptions, true, {}, any>;
export default DDRReport;
