export declare const STRONG_PASSWORD_RX: RegExp;
export declare const STRONG_PASSWORD_MESSAGE = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number";
export declare function assertStrongPassword(password: string): void;
export declare function generateTempPassword(): string;
