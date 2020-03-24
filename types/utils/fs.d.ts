declare type SizeUnit = 'MB' | 'GB';
export declare function checkFullAccess(dest: string, throwError?: boolean): boolean;
export declare function checkReadable(dest: string, throwError?: boolean): boolean;
export declare function isDirectory(dest: string): boolean;
export declare function formateFileSize(size: number, unit: SizeUnit): string;
export declare function delSync(patterns: string | readonly string[]): void;
export {};
