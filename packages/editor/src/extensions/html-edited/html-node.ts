import type { ExtensionOptions } from "@/types";
import Text from "@tiptap/extension-text";
const temporaryDocument = document.implementation.createHTMLDocument();

export const HtmlNode = Text.extend<ExtensionOptions>({
  addOptions() {
    return {};
  },
  renderHTML({ node }) {
    const container = temporaryDocument.createElement("div");
    container.classList.add("html-container");
    container.innerHTML = node.text as string;
    return {
      dom: container,
    };
  },
});
