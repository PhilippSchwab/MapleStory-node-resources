export abstract class NodeType {
  readonly father?: NodeType
  constructor(parent: NodeType) {
    this.father = parent
  }
  abstract async node(): Promise<NodeType | void>
  abstract name(): string
}

export abstract class ValueNodeType extends NodeType {
  abstract async extract(): Promise<any>
}

export default NodeType
