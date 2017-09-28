import {NodeType, ValueNodeType} from './NodeType';
import * as Parser from '../parser';

export type refType = Parser.ImageTypes.ImageNode |
            Parser.ImageTypes.ImageNodeNullValue  |
            Parser.ImageTypes.ImageNodeIntValue   |
            Parser.ImageTypes.ImageNodeFloatValue |
            Parser.ImageTypes.ImageNodeStringValue;

export interface nodeType {
  type: "nodeType"
  value: Parser.ImageTypes.ImageNode
  index?: {
    class: "Property" | "Shape2D#Vector2D" | "Shape2D#Convex2D" | "Canvas" | "Sound_DX8" | "UOL"
    hashTable?: Map<string, ImageSubNode>
    value?: Parser.wz_picture |
            Parser.wz_sound   |
            Parser.wz_vector  |
            Parser.wz_uol
  }
}
export interface valueType {
  type: "valueType"
  value: Parser.ImageTypes.ImageNodeNullValue  |
         Parser.ImageTypes.ImageNodeIntValue   |
         Parser.ImageTypes.ImageNodeFloatValue |
         Parser.ImageTypes.ImageNodeStringValue
}

export class ImageNodeContainer {
  readonly content: nodeType | valueType
  private nodepoint: NodeType
  constructor(ref: refType, nodepoint: NodeType) {
    this.nodepoint = nodepoint
    switch (ref.type) {
      case 'ImageNode':
        this.content = {
          type: "nodeType",
          value: ref
        }
        break;
      case 'null':
      case 'integer':
      case 'float':
      case 'string':
        this.content = {
          type: "valueType",
          value: ref
        }
        break;
      default:
        throw "ImageNodeContainer invaild type";
    }
  }
  async unpack() {
    let self = this
    if (this.content.type === 'nodeType') {
      await this.content.value.extractImg()
      let node = this.content.value.value
      this.content.index = {
        class: node.class
      }
      switch (node.class) {
        case 'Property':
        case 'Canvas':
          this.content.index.hashTable = new Map(node.children.map(function(value): [string, ImageSubNode] {
            return [
              value.name,
              value.type === 'image' ?
                new ImageSubNode(value.name, value.value, self.nodepoint) :
                new ImageSubNode(value.name, value, self.nodepoint)
            ]
          }))
          if (node.class === 'Property') break;
        case 'Shape2D#Vector2D':
        case 'Shape2D#Convex2D':
        case 'Sound_DX8':
        case 'UOL':
          this.content.index.value = node.value
          break;
        default:
          throw "node.class error"
      }
      this.content.value.release()
    }
  }
}

/** ImageSubNode is an all proxy node to manage nodes below Image
 *
 * - value type
 * - `UOL` type redirect
 * - Picture inlink and outlink redirect
 * - `blob` export
 * - Property all export
 */

export class ImageSubNode extends ValueNodeType {
  private container: ImageNodeContainer
  private nodename: string
  readonly imageNodeValue: NodeType
  constructor(name: string, ref: refType, parent: NodeType, imagenode?: NodeType) {
    super(parent)
    this.container = new ImageNodeContainer(ref, this)
    this.nodename = name
    this.imageNodeValue = imagenode || (<ImageSubNode>parent).imageNodeValue
  }
  name() { return this.nodename }
  async node() {}
  async list() {
    if (this.container.content.type === 'nodeType') {
      await this.container.unpack()
      // TODO: list
    }
    else return
  }
  async extract() {}
}

export default ImageNodeContainer
