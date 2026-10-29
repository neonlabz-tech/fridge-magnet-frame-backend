export declare const cleanJson: (...hidden: string[]) => {
    versionKey: boolean;
    transform: (_doc: unknown, ret: Record<string, any>) => Record<string, any>;
};
export declare const nextSequenceId: (existing: string[], prefix: string, pad: number) => string;
export declare const escapeRegex: (value: string) => string;
