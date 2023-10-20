import type { ExtensionOptions } from "@/types";
import Text from "@tiptap/extension-text";
const temporaryDocument = document.implementation.createHTMLDocument();

export const MarkdownNode = Text.extend<ExtensionOptions>({
  addOptions() {
    return {};
  },
  renderHTML({ node }) {
    const container = temporaryDocument.createElement("div");
    container.classList.add("markdown-container");
    container.innerHTML = node.text as string;
    return {
      dom: container,
    };
  },
});
