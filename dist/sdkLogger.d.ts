interface SdkNotice {
    title: string;
    lines: readonly string[];
}
export declare function logSdk(...entry: [kind: 'notice', notice: SdkNotice] | [kind: 'debug', message: string, ...details: unknown[]]): void;
export {};
