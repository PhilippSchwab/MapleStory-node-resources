import * as path from 'path';
import NodeType from './NodeType';
import ImageNode from './ImageNode';
import * as Parser from '../parser';

function loadHash(value: Parser.FileTypes[], self: FileTreeNode | FileNode): Map<string, FileTreeNode | ImageNode> {
  // TODO: recursion
  let maparray = value.map(function(el): [string, FileTreeNode | ImageNode] {
    return [
      el.name,
      el.dirs === true ?
        new FileTreeNode(el.name, self, self.fileNodeValue).loadIndex(el) :
        new ImageNode(el.name, el, self, self.fileNodeValue)
    ]
  })
  return new Map(maparray)
}

export class FileTreeNode extends NodeType {
  constructor(name: string, uplevel: NodeType, filenode?: FileNode) {
    super(uplevel)
    this.fileNodeValue = filenode && <FileNode><any>this // Caution when using
  }
  loadIndex(value: Parser.FileTypes.FileDirInfo) {
    this.hashTable = loadHash(value.dir, this)
    return this
  }
  protected nodeName: string
  protected hashTable: Map<string, FileTreeNode | ImageNode>
  readonly fileNodeValue: FileNode
  async node(path?: string | string[]): Promise<NodeType | void> {
    let pathlist = path ? Array.isArray(path) ? path : path.split('/') : []
    let next = pathlist.shift()
    if (next === '..') {
      return await this.father.node(pathlist)
    }
    else if (next) {
      let nextnode = this.hashTable.get(next)
      if (!nextnode) return
      return await nextnode.node(pathlist)
    }
    else {
      return this
    }
  }
  async list() {
    return Array.from(this.hashTable.keys())
  }
  name() { return this.nodeName }
}

export class FileNode extends FileTreeNode {
  constructor(pathname: string, root: NodeType, name?: string) {
    super(name || path.basename(pathname, '.wz'), root)
    this.file = new Parser.fileclass(pathname)
  }
  protected file: Parser.fileclass
  protected wzfile?: Parser.wz_file
  protected hasIndex: boolean = false
  async openFile() {
    await this.file.open()
  }
  async loadIndexFromFile() {
    await this.openFile()
    this.wzfile = new Parser.wz_file(this.file)
    await this.wzfile.parse()
    this.hashTable = loadHash(this.wzfile.value.dir, this)
    this.hasIndex = true
  }
  dump() {}
  load() {}
  async node(path?: string | string[]): Promise<NodeType | void> {
    let pathlist = path ? Array.isArray(path) ? path : path.split('/') : []
    let next = pathlist.shift()
    if (next === '..') {
      return await this.father.node(pathlist)
    }
    else if (next) {
      if (!this.hasIndex) await this.loadIndexFromFile()
      let nextnode = this.hashTable.get(next)
      if (!nextnode) return
      return await nextnode.node(pathlist)
    }
    else {
      return this
    }
  }
  async list() {
    if (!this.hasIndex) await this.loadIndexFromFile()
    return Array.from(this.hashTable.keys())
  }
}

export default FileNode
