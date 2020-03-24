export declare const BIG_FILE_SIZE = 10485760;
export declare const API_MAX_SIZE = 52428800;
export declare enum CodeType {
    File = 0,
    JavaFile = 1
}
export interface IPackerOptions {
    root?: string;
    name?: string;
    ignore: string | string[];
    incrementalPath?: string;
    functionPath?: string;
    codeType: CodeType;
}
/**
 * 将函数代码转换成 Base64 编码
 * 普通文件：Node，PHP
 * Java 文件：Jar，ZIP
 */
export declare class FunctionPacker {
    name: string;
    type: CodeType;
    funcPath: string;
    zipFilePath: string;
    tmpPath: string;
    ignore: string | string[];
    incrementalPath: string;
    codeType: CodeType;
    constructor(options: IPackerOptions);
    compressFiles(): Promise<void>;
    getJavaFile(): void;
    build(): Promise<void>;
    isBigFile(): Promise<boolean>;
    isReachMaxSize(): Promise<boolean>;
    getBase64Code(): Promise<string>;
    clean(): Promise<void>;
}
