import {
  DOMSerializer,
  Schema,
  type DOMOutputSpec,
  NodeType,
  MarkType,
  Node,
} from "@tiptap/pm/model";

export class CustomDOMSerializer extends DOMSerializer {
  /// Build a serializer using the [`toDOM`](#model.NodeSpec.toDOM)
  /// properties in a schema's node and mark specs.
  static fromSchema(schema: Schema): CustomDOMSerializer {
    return (
      (schema.cached.domSerializer as CustomDOMSerializer) ||
      (schema.cached.domSerializer = new CustomDOMSerializer(
        this.nodesFromSchema(schema),
        this.marksFromSchema(schema),
      ))
    );
  }

  /// Gather the serializers in a schema's node specs into an object.
  /// This can be useful as a base to build a custom serializer from.
  static nodesFromSchema(schema: Schema): { [node: Node]: DOMOutputSpec } {
    const result = gatherToDOM(schema.nodes);
    if (!result.text) {
      result.text = (node: Node) => {
        console.log(node);
        return node.text;
      };
    }
    console.log(result);
    return result as { [node: string]: (node: Node) => DOMOutputSpec };
  }
}

function gatherToDOM(obj: { [node: string]: NodeType | MarkType }) {
  const result: {
    [node: string]: (value: any, inline: boolean) => DOMOutputSpec;
  } = {};
  for (const name in obj) {
    const toDOM = obj[name].spec.toDOM;
    if (toDOM) result[name] = toDOM;
  }
  return result;
}
