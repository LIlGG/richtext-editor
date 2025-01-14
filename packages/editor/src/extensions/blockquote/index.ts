import type { Editor } from "@tiptap/vue-3";
import TiptapBlockquote from "@tiptap/extension-blockquote";
import type { BlockquoteOptions } from "@tiptap/extension-blockquote";
import ToolbarItem from "@/components/toolbar/ToolbarItem.vue";
import MdiFormatQuoteOpen from "~icons/mdi/format-quote-open";
import { markRaw } from "vue";
import { i18n } from "@/locales";
import type { ExtensionOptions } from "@/types";

const Blockquote = TiptapBlockquote.extend<
  ExtensionOptions & BlockquoteOptions
>({
  addOptions() {
    return {
      ...this.parent?.(),
      getToolbarItems({ editor }: { editor: Editor }) {
        return {
          priority: 90,
          component: markRaw(ToolbarItem),
          props: {
            editor,
            isActive: editor.isActive("blockquote"),
            icon: markRaw(MdiFormatQuoteOpen),
            title: i18n.global.t("editor.common.quote"),
            action: () => {
              editor.commands.toggleBlockquote();
            },
          },
        };
      },
    };
  },
});

export default Blockquote;
