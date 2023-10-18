import { mergeAttributes, Node } from "@tiptap/core";
import type { Editor } from "@tiptap/vue-3";
import { markRaw } from "vue";
import MdiCollage from "~icons/mdi/collage";
import { CodeMirrorView } from "./code-mirror-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    htmlEdited: {
      addHtmlEdited: () => ReturnType;
    };
  }
}

const HtmlEdited = Node.create({
  name: "html_edited",

  content: "html+",

  group: "block",

  code: true,

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: "html-edited",
      },
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
      new CodeMirrorView(editor, node, getPos as () => number);
  },

  addCommands() {
    return {
      addHtmlEdited:
        () =>
        ({ commands }) => {
          return commands.setNode(this.name);
        },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[class=html-edited]",
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

export default HtmlEdited;
