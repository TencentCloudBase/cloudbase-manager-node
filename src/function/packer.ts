import os from 'os'
import fs from 'fs'
import del from 'del'
import path from 'path'
import makeDir from 'make-dir'
import { zipDir, checkFullAccess } from '../utils'
import { CloudBaseError } from '../error'

export enum CodeType {
    File,
    JavaFile
}

export interface IPackerOptions {
    // 通过根目录和函数名指定函数路径
    root?: string
    name?: string
    ignore: string | string[]
    incrementalPath?: string
    // 直接指定函数的路径
    functionPath?: string
}

/**
 * 将函数代码转换成 Base64 编码
 * 普通文件：Node，PHP
 * Java 文件：Jar，ZIP
 */
export class FunctionPacker {
    // 函数名
    name: string
    // 代码文件类型
    type: CodeType
    funcPath: string
    funcDistPath: string
    // 存放打包文件的临时目录
    tmpPath: string
    // 忽略文件模式
    ignore: string | string[]
    // 指定增量文件路径
    incrementalPath: string

    /* eslint-disable-next-line */
    constructor(options: IPackerOptions) {
        const { root, name, ignore, incrementalPath, functionPath } = options
        this.name = name
        this.ignore = ignore
        this.funcPath = functionPath ? functionPath : path.resolve(path.join(root, name))
        this.tmpPath = root
            ? path.join(root, '.cloudbase_tmp')
            : path.join(process.cwd(), '.cloudbase_tmp')
        this.incrementalPath = incrementalPath
    }

    async getFileCode() {
        checkFullAccess(this.funcPath, true)
        // 临时构建文件
        this.funcDistPath = path.join(this.tmpPath, this.name)
        // 清除原打包文件
        this.clean()
        // 生成 zip 文件
        await makeDir(this.funcDistPath)
        const zipPath = path.resolve(this.funcDistPath, 'dist.zip')

        const zipOption: any = {
            dirPath: this.funcPath,
            outputPath: zipPath,
            ignore: this.ignore
        }

        if (this.incrementalPath) {
            zipOption.pattern = this.incrementalPath
        }

        await zipDir(zipOption)
        // // 将 zip 文件转换成 base64
        const base64 = fs.readFileSync(zipPath).toString('base64')
        // // 清除打包文件
        await this.clean()
        return base64
    }

    // 获取 Java 代码
    getJavaFileCode() {
        const { funcPath } = this
        // Java 代码为 jar 或 zip 包
        const jarExist = fs.existsSync(`${funcPath}.jar`)
        const zipExist = fs.existsSync(`${funcPath}.zip`)
        if (!jarExist && !zipExist) {
            return null
        }
        const packagePath = jarExist ? `${funcPath}.jar` : `${funcPath}.zip`
        return fs.readFileSync(packagePath).toString('base64')
    }

    async build(type: CodeType) {
        if (type === CodeType.JavaFile) {
            try {
                const code = await this.getJavaFileCode()
                return code
            } catch (e) {
                this.clean()
                throw new CloudBaseError(`函数代码打包失败：${e.message}`, {
                    code: e.code
                })
            }
        }

        if (type === CodeType.File) {
            try {
                const code = await this.getFileCode()
                return code
            } catch (e) {
                this.clean()
                throw new CloudBaseError(`函数代码打包失败：${e.message}`, {
                    code: e.code
                })
            }
        }
    }

    async clean(): Promise<void> {
        // allow deleting the current working directory and outside
        this.funcDistPath && del.sync([this.funcDistPath], { force: true })
        this.tmpPath && del.sync([this.tmpPath], { force: true })
        return
    }
}
