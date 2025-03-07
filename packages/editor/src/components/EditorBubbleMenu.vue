<script lang="ts" setup>
import type { PropType } from "vue";
import type { Editor, AnyExtension } from "@tiptap/core";
import BubbleMenu from "@/components/bubble/BubbleMenu.vue";
import type { NodeBubbleMenu } from "@/types";
import BubbleItem from "@/components/bubble/BubbleItem.vue";
import type { EditorView } from "prosemirror-view";
import type { EditorState } from "prosemirror-state";

const props = defineProps({
  editor: {
    type: Object as PropType<Editor>,
    required: true,
  },
});

const getBubbleMenuFromExtensions = () => {
  const extensionManager = props.editor?.extensionManager;
  return extensionManager.extensions
    .map((extension: AnyExtension) => {
      const { getBubbleMenu } = extension.options;

      if (!getBubbleMenu) {
        return null;
      }

      const nodeBubbleMenu = getBubbleMenu({
        editor: props.editor,
      }) as NodeBubbleMenu;

      if (nodeBubbleMenu.items) {
        nodeBubbleMenu.items = nodeBubbleMenu.items.sort(
          (a, b) => a.priority - b.priority
        );
      }

      return nodeBubbleMenu;
    })
    .filter(Boolean) as NodeBubbleMenu[];
};

const shouldShow = (
  props: {
    editor: Editor;
    node?: HTMLElement;
    view?: EditorView;
    state?: EditorState;
    oldState?: EditorState;
    from?: number;
    to?: number;
  },
  bubbleMenu: NodeBubbleMenu
) => {
  if (!props.editor.isEditable) {
    return false;
  }
  return bubbleMenu.shouldShow?.(props);
};
</script>
<template>
  <bubble-menu
    v-for="(bubbleMenu, index) in getBubbleMenuFromExtensions()"
    :key="index"
    :plugin-key="bubbleMenu?.pluginKey"
    :should-show="(prop) => shouldShow(prop, bubbleMenu)"
    :editor="editor"
    :tippy-options="{
      maxWidth: '100%',
      ...bubbleMenu.tippyOptions,
    }"
    :get-render-container="bubbleMenu.getRenderContainer"
    :default-animation="bubbleMenu.defaultAnimation"
  >
    <div
      class="bubble-menu bg-white flex items-center rounded p-1 border drop-shadow space-x-0.5"
    >
      <template v-if="bubbleMenu.items">
        <template
          v-for="(item, itemIndex) in bubbleMenu.items"
          :key="itemIndex"
        >
          <template v-if="item.component">
            <component
              :is="item.component"
              v-bind="item.props"
              :editor="editor"
            />
          </template>
          <bubble-item v-else :editor="editor" v-bind="item.props" />
        </template>
      </template>
      <template v-else-if="bubbleMenu.component">
        <component :is="bubbleMenu?.component" :editor="editor" />
      </template>
    </div>
  </bubble-menu>
</template>
<style scoped>
.bubble-menu {
  max-width: calc(100vw - 30px);
  overflow-x: auto;
}
</style>
