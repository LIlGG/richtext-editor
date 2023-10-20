import { mergeAttributes, Node } from "@tiptap/core";
import type { Editor, Range } from "@tiptap/vue-3";
import { markRaw } from "vue";
import MdiCollage from "~icons/mdi/collage";
import { CodeMirrorView } from "../../components/code-mirror/code-mirror-view";
import { MarkdownNode } from "./markdown-node";
import { Fragment } from "@tiptap/pm/model";
import { markdown } from "@codemirror/lang-markdown";

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

  // addExtensions() {
  //   return [MarkdownNode];
  // },

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
          const markdownNode = (node as HTMLElement).getElementsByClassName(
            "markdown-container",
          );

          if (markdownNode.length === 0) {
            return Fragment.empty;
          }

          const textNode = schema.text(markdownNode[0].innerHTML);
          return Fragment.from(textNode);
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});

export default MarkdownEdited;
