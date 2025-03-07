import { Editor, findParentNode, mergeAttributes, Node } from "@tiptap/core";
import { Node as PMNode } from "@tiptap/pm/model";
import type { NodeType, Schema } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import { markRaw } from "vue";
import MdiVideo from "~icons/mdi/video";
import { VueNodeViewRenderer } from "@tiptap/vue-3";
import Column from "./column";
import ColumnsView from "./ColumnsView.vue";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    columns: {
      insertColumns: (attrs?: { cols: number }) => ReturnType;
      addColBefore: () => ReturnType;
      addColAfter: () => ReturnType;
      deleteCol: () => ReturnType;
    };
  }
}

const createColumns = (schema: Schema, colsCount: number) => {
  const types = getColumnsNodeTypes(schema);
  const cols = [];

  for (let index = 0; index < colsCount; index += 1) {
    const col = types.column.createAndFill({ index });

    if (col) {
      cols.push(col);
    }
  }
  return types.columns.createChecked({ cols: colsCount }, cols);
};

const getColumnsNodeTypes = (
  schema: Schema
): {
  columns: NodeType;
  column: NodeType;
} => {
  if (schema.cached.columnsNodeTypes) {
    return schema.cached.columnsNodeTypes;
  }

  const roles = {
    columns: schema.nodes["columns"],
    column: schema.nodes["column"],
  };

  schema.cached.columnsNodeTypes = roles;

  return roles;
};

type ColOperateType = "addBefore" | "addAfter" | "delete";
const addOrDeleteCol = (
  dispatch: any,
  state: EditorState,
  type: ColOperateType
) => {
  const maybeColumns = findParentNode(
    (node) => node.type.name === Columns.name
  )(state.selection);
  const maybeColumn = findParentNode((node) => node.type.name === Column.name)(
    state.selection
  );
  if (dispatch && maybeColumns && maybeColumn) {
    const cols = maybeColumns.node;
    const colIndex = maybeColumn.node.attrs.index;
    const colsJSON = cols.toJSON();

    let nextIndex = colIndex;

    if (type === "delete") {
      nextIndex = colIndex - 1;
      colsJSON.content.splice(colIndex, 1);
    } else {
      nextIndex = type === "addBefore" ? colIndex : colIndex + 1;
      colsJSON.content.splice(nextIndex, 0, {
        type: "column",
        attrs: {
          index: colIndex,
        },
        content: [
          {
            type: "paragraph",
          },
        ],
      });
    }

    colsJSON.attrs.cols = colsJSON.content.length;

    colsJSON.content.forEach((colJSON: any, index: number) => {
      colJSON.attrs.index = index;
    });

    const nextCols = PMNode.fromJSON(state.schema, colsJSON);

    let nextSelectPos = maybeColumns.pos;
    nextCols.content.forEach((col, pos, index) => {
      if (index < nextIndex) {
        nextSelectPos += col.nodeSize;
      }
    });

    const tr = state.tr.setTime(Date.now());

    tr.replaceWith(
      maybeColumns.pos,
      maybeColumns.pos + maybeColumns.node.nodeSize,
      nextCols
    ).setSelection(TextSelection.near(tr.doc.resolve(nextSelectPos)));

    dispatch(tr);
  }
  return true;
};

type GotoColType = "before" | "after";
const gotoCol = (state: EditorState, dispatch: any, type: GotoColType) => {
  const maybeColumns = findParentNode(
    (node) => node.type.name === Columns.name
  )(state.selection);
  const maybeColumn = findParentNode((node) => node.type.name === Column.name)(
    state.selection
  );

  if (dispatch && maybeColumns && maybeColumn) {
    const cols = maybeColumns.node;
    const colIndex = maybeColumn.node.attrs.index;

    let nextIndex = 0;

    if (type === "before") {
      nextIndex = (colIndex - 1 + cols.attrs.cols) % cols.attrs.cols;
    } else {
      nextIndex = (colIndex + 1) % cols.attrs.cols;
    }

    let nextSelectPos = maybeColumns.pos;
    cols.content.forEach((col, pos, index) => {
      if (index < nextIndex) {
        nextSelectPos += col.nodeSize;
      }
    });

    const tr = state.tr.setTime(Date.now());

    tr.setSelection(TextSelection.near(tr.doc.resolve(nextSelectPos)));
    dispatch(tr);
    return true;
  }

  return false;
};

const Columns = Node.create({
  name: "columns",
  group: "block",
  priority: 10,
  defining: true,
  isolating: true,
  allowGapCursor: false,
  content: "column{1,}",

  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {
        class: "columns",
      },
      getCommandMenuItems() {
        return {
          priority: 1,
          icon: markRaw(MdiVideo),
          title: "editor.extensions.commands_menu.columns",
          keywords: ["zhuanlan", "buju", "columns"],
          command: ({ editor, range }: { editor: Editor; range: Range }) => {
            editor
              .chain()
              .focus()
              .deleteRange(range)
              .insertColumns({
                cols: 2,
              })
              .run();
          },
        };
      },
    };
  },

  addNodeView() {
    return VueNodeViewRenderer(ColumnsView);
  },

  addAttributes() {
    return {
      cols: {
        default: 2,
        parseHTML: (element) => element.getAttribute("cols"),
      },
      style: {
        default: "display: flex;width: 100%;grid-gap: 8px;gap: 8px;",
        parseHTML: (element) => element.getAttribute("style"),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[class=grid]",
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

  addCommands() {
    return {
      insertColumns:
        (attrs) =>
        ({ tr, dispatch, editor }) => {
          const node = createColumns(editor.schema, (attrs && attrs.cols) || 3);

          if (dispatch) {
            const offset = tr.selection.anchor + 1;

            tr.replaceSelectionWith(node)
              .scrollIntoView()
              .setSelection(TextSelection.near(tr.doc.resolve(offset)));
          }

          return true;
        },
      addColBefore:
        () =>
        ({ dispatch, state }) => {
          return addOrDeleteCol(dispatch, state, "addBefore");
        },
      addColAfter:
        () =>
        ({ dispatch, state }) => {
          return addOrDeleteCol(dispatch, state, "addAfter");
        },
      deleteCol:
        () =>
        ({ dispatch, state }) => {
          return addOrDeleteCol(dispatch, state, "delete");
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Alt-G": () => this.editor.commands.insertColumns(),
      Tab: () => {
        return gotoCol(this.editor.state, this.editor.view.dispatch, "after");
      },
      "Shift-Tab": () => {
        return gotoCol(this.editor.state, this.editor.view.dispatch, "before");
      },
    };
  },
});

export default Columns;
