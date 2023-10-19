import type { ExtensionOptions, NodeBubbleMenu } from "@/types";
import { Editor, isActive, mergeAttributes, Node } from "@tiptap/core";
import type { EditorState } from "@tiptap/pm/state";
import { markRaw } from "vue";
import MdiWeb from "~icons/mdi/web";
import MdiBorderAllVariant from "~icons/mdi/border-all-variant";
import MdiBorderNoneVariant from "~icons/mdi/border-none-variant";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    myCard: {
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
          priority: 10,
          icon: markRaw(MdiWeb),
          title: "隐藏内容",
          keywords: ["隐藏内容", "yincangneirong"],
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor.chain().focus().deleteRange(range).setMyCard().run();
          },
        };
      },
      getBubbleMenu({ editor }: { editor: Editor }): NodeBubbleMenu {
        return {
          pluginKey: "myCardBubbleMenu",
          shouldShow: ({ state }: { state: EditorState }) => {
            if (
              editor
                .getAttributes(MyCardExtension.name)
                .class?.indexOf("my-card") === -1
            ) {
              return false;
            }
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
                icon:
                  editor
                    .getAttributes(MyCardExtension.name)
                    .class?.indexOf("my-card") != -1
                    ? markRaw(MdiBorderAllVariant)
                    : undefined,
                visible: () => {
                  return (
                    editor
                      .getAttributes(MyCardExtension.name)
                      .class?.indexOf("my-card") != -1
                  );
                },
                action: () => {
                  editor
                    .chain()
                    .updateAttributes(MyCardExtension.name, {
                      class: "",
                    })
                    .focus()
                    .run();
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
      setMyCard:
        () =>
        ({ chain, state }) => {
          const content = state.selection.content();
          return chain()
            .insertContent({
              type: this.name,
              content:
                content.size > 0
                  ? content.content.toJSON()
                  : [
                      {
                        type: "paragraph",
                      },
                    ],
            })
            .run();
        },
    //   unsetMyCard:
    //     () =>
    //     ({ chain, state }) => {
    //         return chain().clearNodes
    //     },
    };
  },
});

export default MyCardExtension;
