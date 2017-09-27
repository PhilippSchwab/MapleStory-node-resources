import {NodeType, ValueNodeType} from './NodeType';
import {ImageNodeContainer, ImageSubNode} from './ImageNodeContainer';
import * as Parser from '../parser';

export class ImageNode extends ValueNodeType {
  private container: ImageNodeContainer
  private nodename: string
  private imagesubnode: Parser.wz_image
  readonly fileNodeValue: NodeType
  readonly imageNodeValue: NodeType
  constructor(name: string, ref: Parser.wz_image, parent: NodeType, filenode: NodeType) {
    super(parent)
    this.nodename = name
    this.imagesubnode = ref.parse()
    this.fileNodeValue = filenode
    this.imageNodeValue = this
    this.container = new ImageNodeContainer(ref.value, this)
  }
  name() { return this.nodename }
  async node() {}
  async extract() {}
}

export default ImageNode
