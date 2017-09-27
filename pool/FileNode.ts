import * as path from 'path';
import NodeType from './NodeType';
import ImageNode from './ImageNode';
import * as Parser from '../parser';
export class FileTreeNode extends NodeType {
  constructor(name: string, uplevel: NodeType, filenode?: FileNode) {
    super(uplevel)
    this.fileNodeValue = filenode && <FileNode><any>this // Caution when using
  }
  protected nodeName: string
  protected hashTable: Map<string, FileTreeNode | ImageNode>
  readonly fileNodeValue: FileNode
  async node() {}
  name() { return this.nodeName }
}

export class FileNode extends FileTreeNode {
  constructor(pathname: string, root: NodeType, name?: string) {
    super(name || path.basename(pathname, '.wz'), root)
    this.file = new Parser.fileclass(pathname)
  }
  protected file: Parser.fileclass
  protected wzfile?: Parser.wz_file
  async openFile() {
    await this.file.open()
  }
  async loadIndexFromFile() {
    this.wzfile = new Parser.wz_file(this.file)
    await this.wzfile.parse()
    function recursion(value: Parser.FileTypes) {
      // TODO: recursion
      if (value.dirs) {
        value
      }
      else {
        value
      }
    }
    this.wzfile.value
  }
  dump() {}
  load() {}
  async node() {}
}

export default FileNode
