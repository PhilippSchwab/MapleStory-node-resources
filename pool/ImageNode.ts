import {NodeType, ValueNodeType} from './NodeType';
import {ImageNodeContainer, ImageSubNode} from './ImageNodeContainer';
import * as Parser from '../parser';

export class ImageNode extends ValueNodeType {
  private container: ImageNodeContainer
  private nodename: string
  private imagesubnode: Parser.wz_image
  private luanode: boolean = false
  readonly fileNodeValue: NodeType
  readonly imageNodeValue: NodeType
  constructor(name: string, info: Parser.FileTypes.ImageInfo, parent: NodeType, filenode: NodeType) {
    super(parent)
    let ref = new Parser.wz_image(info)
    this.nodename = name
    this.imagesubnode = ref.parse()
    this.fileNodeValue = filenode
    this.imageNodeValue = this
    this.container = new ImageNodeContainer(ref.value, this)
  }
  name() { return this.nodename }
  async node(path?: string | string[]): Promise<NodeType | void> {
    let pathlist = path ? Array.isArray(path) ? path : path.split('/') : []
    let next = pathlist.shift()
    if (this.luanode) return
    if (next === '..') {
      return await this.father.node(pathlist)
    }
    else if (next) {
      return
    }
    else {
      return this
    }
  }
  async list() {
    if (this.container.content.type === 'nodeType') {
      await this.container.unpack()
      // TODO: list
    }
    else return
  }
  async extract() {}
}

export default ImageNode
