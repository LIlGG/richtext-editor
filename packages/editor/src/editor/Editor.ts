import { type Fragment, type Schema } from "@tiptap/pm/model";
import { Editor as CoreEditor } from "@tiptap/vue-3";
import { CustomDOMSerializer } from "./CustomDOMSerializer";

export class Editor extends CoreEditor {
  public getHTML(): string {
    return getHTMLFromFragment(this.state.doc.content, this.schema);
  }
}

function getHTMLFromFragment(fragment: Fragment, schema: Schema): string {
  const documentFragment =
    CustomDOMSerializer.fromSchema(schema).serializeFragment(fragment);

  const temporaryDocument = document.implementation.createHTMLDocument();
  const container = temporaryDocument.createElement("div");

  container.appendChild(documentFragment);

  return container.innerHTML;
}
