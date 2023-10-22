import { mergeAttributes, Node } from "@tiptap/core";
import type { Editor, Range } from "@tiptap/vue-3";
import { markRaw } from "vue";
import MdiCollage from "~icons/mdi/collage";
import { CodeMirrorView } from "./code-mirror-view";
import { Fragment } from "@tiptap/pm/model";
import { markdown } from "@codemirror/lang-markdown";
import { marked } from "marked";
import TurndownService from "turndown";
const temporaryDocument = document.implementation.createHTMLDocument();
const turndownService = new TurndownService();

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    MarkdownEdited: {
      addMarkdownEdited: () => ReturnType;
    };
  }
}

const MarkdownEdited = Node.create({
  name: "markdown_edited",

  content: "text*",

  group: "block",

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "markdown-edited",
      },
      getCommandMenuItems() {
        return {
          priority: 1,
          icon: markRaw(MdiCollage),
          title: "Markdown 编辑",
          keywords: ["markdown"],
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor.chain().focus().deleteRange(range).addMarkdownEdited().run();
          },
        };
      },
    };
  },

  addNodeView() {
    return ({ editor, node, getPos }) =>
      new CodeMirrorView(editor, node, getPos as () => number, [markdown()]);
  },

  addCommands() {
    return {
      addMarkdownEdited:
        () =>
        ({ chain }) => {
          return chain().setNode(this.type).run();
        },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[class=markdown-edited]",
        getContent: (node, schema) => {
          const htmlNode = node as HTMLElement;
          if (!htmlNode) {
            return Fragment.empty;
          }
          // html covert to markdown
          const markdown = turndownService.turndown(htmlNode.innerHTML);
          const textNode = schema.text(markdown);
          return Fragment.from(textNode);
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const content = node.content;
    if (!content.firstChild) {
      return ["div", mergeAttributes(HTMLAttributes, {})];
    }
    const container = temporaryDocument.createElement("div");
    container.classList.add("markdown-edited");
    // markdown covert to html
    container.innerHTML = marked.parse(content.firstChild.text || "");
    return {
      dom: container,
    };
  },
});

export default MarkdownEdited;
