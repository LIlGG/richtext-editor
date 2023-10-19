import Text from "@tiptap/extension-text";

export const HtmlNode = Text.extend({
  renderHTML({ node }) {
    const doc = document.createElement("div");
    doc.innerHTML = node.text as string;
    return {
      dom: doc,
    };
  },
});
