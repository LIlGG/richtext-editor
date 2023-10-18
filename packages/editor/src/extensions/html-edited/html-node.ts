import { Node } from "@tiptap/core";

const HtmlNode = Node.create({
  name: "html",
  group: "inline",
  inline: true,
  content: "text*",
});

export default HtmlNode;
