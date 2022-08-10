import type { Editor, Range } from "@tiptap/vue-3";
import { VueRenderer } from "@tiptap/vue-3";
import type { Instance } from "tippy.js";
import tippy, { roundArrow } from "tippy.js";
import "tippy.js/dist/svg-arrow.css";
import CommandsView from "./CommandsView.vue";
import MdiFormatBold from "~icons/mdi/format-bold";
import MdiFormatItalic from "~icons/mdi/format-italic";
import MdiFormatHeader1 from "~icons/mdi/format-header-1";
import MdiFormatHeader2 from "~icons/mdi/format-header-2";
import MdiFormatHeader3 from "~icons/mdi/format-header-3";
import MdiFormatHeader4 from "~icons/mdi/format-header-4";
import MdiFormatHeader5 from "~icons/mdi/format-header-5";
import MdiFormatHeader6 from "~icons/mdi/format-header-6";
import type { Component } from "vue";

export interface Item {
  icon: Component;
  title: string;
  keywords: string[];
  command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

export default {
  items: ({ query }: { query: string }): Item[] => {
    return [
      {
        icon: MdiFormatHeader1,
        title: "一级标题",
        keywords: ["h1", "header1", "1", "yijibiaoti"],
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 1 })
            .run();
        },
      },
      {
        icon: MdiFormatHeader2,
        title: "二级标题",
        keywords: ["h2", "header2", "2", "erjibiaoti"],
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 2 })
            .run();
        },
      },
      {
        icon: MdiFormatHeader3,
        title: "三级标题",
        keywords: ["h3", "header3", "3", "sanjibiaoti"],
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 3 })
            .run();
        },
      },
      {
        icon: MdiFormatHeader4,
        title: "四级标题",
        keywords: ["h4", "header4", "4", "sijibiaoti"],
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 4 })
            .run();
        },
      },
      {
        icon: MdiFormatHeader5,
        title: "五级标题",
        keywords: ["h5", "header5", "5", "wujibiaoti"],
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 5 })
            .run();
        },
      },
      {
        icon: MdiFormatHeader6,
        title: "六级标题",
        keywords: ["h6", "header6", "6", "liujibiaoti"],
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .setNode("heading", { level: 6 })
            .run();
        },
      },
      {
        icon: MdiFormatBold,
        title: "粗体",
        keywords: ["bold", "cuti"],
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor.chain().focus().deleteRange(range).setMark("bold").run();
        },
      },
      {
        icon: MdiFormatItalic,
        title: "斜体",
        keywords: ["italic", "xieiti"],
        command: ({ editor, range }: { editor: Editor; range: Range }) => {
          editor.chain().focus().deleteRange(range).setMark("italic").run();
        },
      },
    ]
      .filter((item) =>
        [...item.keywords, item.title].some((keyword) =>
          keyword.includes(query)
        )
      )
      .slice(0, 10);
  },

  render: () => {
    let component: VueRenderer;
    let popup: Instance[];

    return {
      onStart: (props: Record<string, any>) => {
        component = new VueRenderer(CommandsView, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          arrow: roundArrow,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate(props: Record<string, any>) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: Record<string, any>) {
        if (props.event.key === "Escape") {
          popup[0].hide();

          return true;
        }

        return component.ref?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};
