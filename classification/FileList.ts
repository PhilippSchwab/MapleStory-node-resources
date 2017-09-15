import * as fs from "fs";
import { fileclass, wz_file } from "../parser";

export function FileList(path: string[] | string) {
  let FilePathList: string[]
  if (Array.isArray(path)) {
    FilePathList = path
  }
  else {
    try {
      FilePathList = fs.readdirSync(path).filter(e => /\.wz$/.test(e))
    } catch (error) {
      if (error.code = 'ENOENT') {
        console.error(`no such file or directory, scandir '${path}'`)
      }
      else {
        throw error
      }
      FilePathList = []
    }
  }
  return FilePathList.map((filename) => new fileclass(filename))
}

export async function wzFileList(list: fileclass[]) {
  await Promise.all(list.map(e => e.open()))
  list.map(e => new wz_file(e))
}

export default FileList
