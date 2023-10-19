import type { App, Plugin } from "vue";
import RichTextEditor from "./components/Editor.vue";
import "./styles/index.scss";
import "./styles/tailwind.css";
import "floating-vue/dist/style.css";
import "github-markdown-css/github-markdown-light.css";
import "highlight.js/styles/github-dark.css";
import { DOMSerializer, type Fragment, type Schema } from "@tiptap/pm/model";
import { getHTMLFromFragment, type Editor } from "@tiptap/core";

const plugin: Plugin = {
  install(app: App) {
    app.component("RichTextEditor", RichTextEditor);
  },
};

export default plugin;

export { RichTextEditor };

export * from "./editor";
export * from "./extensions";
export * from "./components";

// export function getHTMLFromFragment(
//   fragment: Fragment,
//   schema: Schema,
// ): string {
//   const temporaryDocument = document.implementation.createHTMLDocument();
//   const htmlBlock = temporaryDocument.createElement("div");
//   fragment.nodesBetween(0, fragment.size, (node) => {
//     if (node.type.name === "html_edited") {
//       const container = temporaryDocument.createElement("div");
//       container.classList.add("html-edited");
//       container.innerHTML = node.textContent;
//       htmlBlock.appendChild(container);
//     } else {
//       htmlBlock.appendChild(
//         DOMSerializer.fromSchema(schema).serializeNode(node),
//       );
//     }
//   });
//   return htmlBlock.innerHTML;
// }

export function getHTML(editor: Editor) {
  const text = getHTMLFromFragment(editor?.state.doc.content, editor?.schema);
  console.log(text);
  return text;
}
