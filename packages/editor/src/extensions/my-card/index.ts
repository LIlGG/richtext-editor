import type { ExtensionOptions, NodeBubbleMenu } from "@/types";
import {
  Editor,
  findParentNode,
  isActive,
  mergeAttributes,
  Node,
} from "@tiptap/core";
import {
  NodeSelection,
  type EditorState,
  type Selection,
  Transaction,
} from "@tiptap/pm/state";
import { markRaw } from "vue";
import MdiWeb from "~icons/mdi/web";
import MdiBorderNoneVariant from "~icons/mdi/border-none-variant";
import { liftTarget } from "@tiptap/pm/transform";
import { Node as PMNode } from "@tiptap/pm/model";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    myCard: {
      insertMyCard: () => ReturnType;
      setMyCard: () => ReturnType;
      unsetMyCard: () => ReturnType;
    };
  }
}

const MyCardExtension = Node.create<ExtensionOptions>({
  name: "my_card",

  group: "block",

  content: "block*",

  priority: 10,

  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: "my-card",
        parseHTML: (element) => element.getAttribute("class"),
      },
    };
  },

  onCreate() {
    this.editor.extensionManager.extensions.forEach((extension) => {
      if (extension.name == "text") {
        const bubbleMenu = (
          extension.options as ExtensionOptions
        )?.getBubbleMenu?.({
          editor: this.editor,
        });

        if (!bubbleMenu?.items) {
          return;
        }

        const items = bubbleMenu.items;
        if (!items || items.length == 0) {
          return;
        }

        items.push({
          priority: 1,
          props: {
            action: () => {
              this.editor.chain().setMyCard().focus().run();
            },
            visible: () => {
              const content = this.editor.state.selection.content();
              let visible = true;
              if (content.size > 0) {
                content.content.descendants((node, pos, parent) => {
                  if (
                    parent &&
                    parent.type.name === MyCardExtension.name &&
                    parent.attrs.class != ""
                  ) {
                    visible = false;
                    return false;
                  }
                });
              }

              return visible;
            },
            icon: markRaw(MdiBorderNoneVariant),
            title: "隐藏内容",
          },
        });

        (extension.options as ExtensionOptions).getBubbleMenu = () => {
          return {
            ...bubbleMenu,
            items,
          };
        };
      }
    });
  },

  addOptions() {
    return {
      getCommandMenuItems() {
        return {
          priority: 50,
          icon: markRaw(MdiWeb),
          title: "插入隐藏内容",
          keywords: ["隐藏内容", "yincangneirong"],
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor.chain().focus().deleteRange(range).insertMyCard().run();
          },
        };
      },
      getBubbleMenu({ editor }: { editor: Editor }): NodeBubbleMenu {
        return {
          pluginKey: "myCardBubbleMenu",
          shouldShow: ({ state }: { state: EditorState }) => {
            return isActive(state, MyCardExtension.name);
          },
          getRenderContainer(node: HTMLElement) {
            let container = node;
            if (container.nodeName === "#text") {
              container = node.parentElement as HTMLElement;
            }
            while (
              container &&
              container.classList &&
              !container.classList.contains("my-card")
            ) {
              container = container.parentElement as HTMLElement;
            }
            return container;
          },
          items: [
            {
              priority: 10,
              props: {
                icon: isActive(editor.state, MyCardExtension.name)
                  ? markRaw(MdiBorderNoneVariant)
                  : undefined,
                visible: () => {
                  return isActive(editor.state, MyCardExtension.name);
                },
                action: () => {
                  editor.chain().focus().unsetMyCard().run();
                },
                title: "取消隐藏内容",
              },
            },
          ],
        };
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[class=my-card]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      insertMyCard:
        () =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              content: [
                {
                  type: "paragraph",
                },
              ],
            })
            .run();
        },
      setMyCard:
        () =>
        ({ chain }) => {
          return chain().wrapIn(this.type).run();
        },
      unsetMyCard:
        () =>
        ({ view, state, tr, dispatch }) => {
          const $pos = findMyCard(state.selection);
          if (!$pos) {
            return false;
          }
          tr.setSelection(new NodeSelection(tr.doc.resolve($pos.pos)));
          clearNodes({ state, tr, dispatch });
          view.dispatch(tr);
          return true;
        },
    };
  },
});

export const clearNodes = ({
  state,
  tr,
  dispatch,
}: {
  state: EditorState;
  tr: Transaction;
  dispatch: ((args?: any) => any) | undefined;
}) => {
  const { selection } = tr;
  const { ranges } = selection;
  if (!dispatch) {
    return true;
  }

  ranges.forEach(({ $from, $to }) => {
    state.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      if (node.type.isText) {
        return;
      }

      const { doc, mapping } = tr;
      const $mappedFrom = doc.resolve(mapping.map(pos));
      const $mappedTo = doc.resolve(mapping.map(pos + node.nodeSize));
      const nodeRange = $mappedFrom.blockRange($mappedTo);

      if (!nodeRange) {
        return;
      }

      const targetLiftDepth = liftTarget(nodeRange);

      if (targetLiftDepth || targetLiftDepth === 0) {
        tr.lift(nodeRange, targetLiftDepth);
      }
    });
  });

  return true;
};

const findMyCard = (
  selection: Selection,
):
  | {
      pos: number;
      start: number;
      depth: number;
      node: PMNode;
    }
  | undefined => {
  return findParentNode((node) => node.type.name === MyCardExtension.name)(
    selection,
  ) as
    | {
        pos: number;
        start: number;
        depth: number;
        node: PMNode;
      }
    | undefined;
};

export default MyCardExtension;
