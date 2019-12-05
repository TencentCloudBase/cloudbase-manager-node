export declare enum CodeType {
    File = 0,
    JavaFile = 1
}
/**
 * 将函数代码转换成 Base64 编码
 * 普通文件：Node，PHP
 * Java 文件：Jar，ZIP
 */
export declare class FunctionPacker {
    root: string;
    name: string;
    type: CodeType;
    funcPath: string;
    funcDistPath: string;
    tmpPath: string;
    ignore: string | string[];
    constructor(root: string, name: string, ignore: string | string[]);
    validPath(path: string): void;
    getFileCode(): Promise<string>;
    getJavaFileCode(): string;
    build(type: CodeType): Promise<string>;
    clean(): Promise<void>;
}
