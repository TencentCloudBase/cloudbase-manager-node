import fs from 'fs'
import { CloudBaseError } from '../error'

type SizeUnit = 'MB' | 'GB'

export function checkPathExist(dest: string, throwError = false): boolean {
    const exist = fs.existsSync(dest)

    if (!exist && throwError) {
        throw new CloudBaseError(`路径不存在：${dest}`)
    }

    return exist
}

export function isDirectory(dest: string) {
    checkPathExist(dest, true)
    return fs.statSync(dest).isDirectory()
}

export function formateFileSize(size: number, unit: SizeUnit) {
    const unitMap = {
        KB: 1024,
        MB: Math.pow(1024, 2),
        GB: Math.pow(1024, 3)
    }

    return Number(size / unitMap[unit]).toFixed(2)
}
