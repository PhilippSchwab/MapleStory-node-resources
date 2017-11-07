import {NodeType} from './NodeType';
import * as Parser from '../parser';

export type refType = Parser.ImageTypes.ImageNode |
            Parser.ImageTypes.ImageNodeNullValue  |
            Parser.ImageTypes.ImageNodeIntValue   |
            Parser.ImageTypes.ImageNodeFloatValue |
            Parser.ImageTypes.ImageNodeStringValue;

export interface ValueNodeType {
  node(): Promise<NodeType | void>
  extract(): Promise<any>
}

export interface nodeType {
  type: "nodeType"
  value: Parser.ImageTypes.ImageNode
  index?: {
    class: "Property" | "Shape2D#Vector2D" | "Shape2D#Convex2D" | "Canvas" | "Sound_DX8" | "UOL"
    hashTable?: Map<string, ValueNodeType>
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

export interface Container {
  readonly content: nodeType | valueType
}

export async function extractContainer(container: Container): Promise<any> {

}

export default extractContainer
