<script lang="ts" setup>
import type { Node as ProseMirrorNode } from "prosemirror-model";
import type { Decoration } from "prosemirror-view";
import { Editor, NodeViewWrapper, Node } from "@tiptap/vue-3";
import { computed, onMounted, ref } from "vue";
import { i18n } from "@/locales";

const props = defineProps<{
  editor: Editor;
  node: ProseMirrorNode;
  decorations: Decoration[];
  selected: boolean;
  extension: Node<any, any>;
  getPos: () => number;
  updateAttributes: (attributes: Record<string, any>) => void;
  deleteNode: () => void;
}>();

const src = computed({
  get: () => {
    return props.node?.attrs.src;
  },
  set: (src: string) => {
    props.updateAttributes({ src: src });
  },
});

const controls = computed(() => {
  return props.node.attrs.controls;
});

const autoplay = computed(() => {
  return props.node.attrs.autoplay;
});

const loop = computed(() => {
  return props.node.attrs.loop;
});

function handleSetFocus() {
  props.editor.commands.setNodeSelection(props.getPos());
}

const inputRef = ref();

onMounted(() => {
  if (!src.value) {
    inputRef.value.focus();
  }
});
</script>

<template>
  <node-view-wrapper as="div">
    <div
      class="inline-block overflow-hidden transition-all text-center relative h-full"
      :style="{
        width: node.attrs.width,
      }"
    >
      <div v-if="!src" class="p-1.5">
        <input
          ref="inputRef"
          v-model.lazy="src"
          class="block px-2 w-full py-1.5 text-sm text-gray-900 border border-gray-300 rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
          :placeholder="i18n.global.t('editor.common.placeholder.link_input')"
          tabindex="-1"
          @focus="handleSetFocus"
        />
      </div>
      <video
        v-else
        :controls="controls"
        :autoplay="autoplay"
        :loop="loop"
        class="rounded-md m-0"
        :src="node!.attrs.src"
        :style="{
          width: node.attrs.width,
          height: node.attrs.height,
        }"
        @mouseenter="handleSetFocus"
      ></video>
    </div>
  </node-view-wrapper>
</template>
