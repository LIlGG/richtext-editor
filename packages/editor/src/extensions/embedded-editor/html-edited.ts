import { mergeAttributes, Node } from "@tiptap/core";
import type { Editor, Range } from "@tiptap/vue-3";
import { markRaw } from "vue";
import MdiCollage from "~icons/mdi/collage";
import { CodeMirrorView } from "./code-mirror-view";
import { Fragment } from "@tiptap/pm/model";
import { html } from "@codemirror/lang-html";
const temporaryDocument = document.implementation.createHTMLDocument();
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    htmlEdited: {
      addHtmlEdited: () => ReturnType;
    };
  }
}

const HtmlEdited = Node.create({
  name: "html_edited",

  content: "text*",

  group: "block",

  defining: true,

  addOptions() {
    return {
      getCommandMenuItems() {
        return {
          priority: 1,
          icon: markRaw(MdiCollage),
          title: "HTML 编辑",
          keywords: ["html", "编辑器"],
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor.chain().focus().deleteRange(range).addHtmlEdited().run();
          },
        };
      },
    };
  },

  addNodeView() {
    return ({ editor, node, getPos }) =>
      new CodeMirrorView(editor, node, getPos as () => number, [
        html({
          matchClosingTags: true,
          autoCloseTags: true,
          selfClosingTags: true,
        }),
      ]);
  },

  addCommands() {
    return {
      addHtmlEdited:
        () =>
        ({ chain }) => {
          return chain().setNode(this.type).run();
        },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[class=html-edited]",
        getContent: (node, schema) => {
          const htmlNode = node as HTMLElement;
          if (!htmlNode) {
            return Fragment.empty;
          }
          const textNode = schema.text(htmlNode.innerHTML);
          return Fragment.from(textNode);
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const content = node.content;
    if (content.size === 0) {
      return ["div", mergeAttributes(HTMLAttributes, {})];
    }
    const container = temporaryDocument.createElement("div");
    container.classList.add("html-edited");
    container.innerHTML = content.toJSON()[0].text;
    return {
      dom: container,
    };
  },
});

export default HtmlEdited;
