declare type SizeUnit = 'MB' | 'GB';
export declare function checkPathExist(dest: string, throwError?: boolean): boolean;
export declare function isDirectory(dest: string): boolean;
export declare function formateFileSize(size: number, unit: SizeUnit): string;
export {};
