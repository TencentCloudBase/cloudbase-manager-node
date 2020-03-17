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
    funcDistPath: string;
    tmpPath: string;
    ignore: string | string[];
    incrementalPath: string;
    constructor(options: IPackerOptions);
    getFileCode(): Promise<string>;
    getJavaFileCode(): string;
    build(type: CodeType): Promise<string>;
    clean(): Promise<void>;
}
