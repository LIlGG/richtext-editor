import type { EditorView as PMEditorView, NodeView } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/core";
import {
  EditorView as CodeMirror,
  ViewUpdate,
  keymap as cmKeymap,
  type KeyBinding,
  drawSelection,
} from "@codemirror/view";
import { html } from "@codemirror/lang-html";
import { defaultKeymap } from "@codemirror/commands";
import { Selection, TextSelection } from "@tiptap/pm/state";
import { exitCode } from "@tiptap/pm/commands";
import { undo, redo } from "@tiptap/pm/history";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
} from "@codemirror/language";

export class CodeMirrorView implements NodeView {
  editor: Editor;
  node: PMNode;
  view: PMEditorView;
  getPos: () => number;
  cm: CodeMirror;
  dom: Node;
  contentDOM?: HTMLElement | null | undefined;
  updating: boolean;

  constructor(editor: Editor, node: PMNode, getPos: () => number) {
    const { view } = editor;
    this.editor = editor;
    this.node = node;
    this.view = view;
    this.getPos = getPos;

    // 创建 CodeMirror 实例
    this.cm = new CodeMirror({
      doc: this.node.textContent,
      extensions: [
        cmKeymap.of([...this.codeMirrorKeymap(), ...defaultKeymap]),
        drawSelection(),
        syntaxHighlighting(defaultHighlightStyle),
        html(),
        CodeMirror.updateListener.of((update) => this.forwardUpdate(update)),
      ],
    });

    // 将 codeMirror 实例的 dom 节点作为 dom 节点
    this.dom = this.cm.dom;

    // 防止外部编辑器与内部编辑器重复更新
    this.updating = false;
  }

  codeMirrorKeymap(): KeyBinding[] {
    const view = this.view;
    return [
      { key: "ArrowUp", run: () => this.maybeEscape("line", -1) },
      { key: "ArrowLeft", run: () => this.maybeEscape("char", -1) },
      { key: "ArrowDown", run: () => this.maybeEscape("line", 1) },
      { key: "ArrowRight", run: () => this.maybeEscape("char", 1) },
      {
        key: "Ctrl-Enter",
        run: () => {
          if (!exitCode(view.state, view.dispatch)) {
            return false;
          }
          view.focus();
          return true;
        },
      },
      {
        key: "Ctrl-z",
        mac: "Cmd-z",
        run: () => undo(view.state, view.dispatch),
      },
      {
        key: "Shift-Ctrl-z",
        mac: "Shift-Cmd-z",
        run: () => redo(view.state, view.dispatch),
      },
      {
        key: "Ctrl-y",
        mac: "Cmd-y",
        run: () => redo(view.state, view.dispatch),
      },
    ];
  }

  maybeEscape(unit: string, dir: number) {
    const { state } = this.cm;
    const { main } = state.selection;
    let stateMain: any = main;
    if (!main.empty) {
      return false;
    }
    if (unit == "line") {
      stateMain = state.doc.lineAt(main.head);
    }
    if (dir < 0 ? stateMain.from > 0 : stateMain.to < state.doc.length) {
      return false;
    }
    const targetPos = this.getPos() + (dir < 0 ? 0 : this.node.nodeSize);
    const selection = Selection.near(
      this.view.state.doc.resolve(targetPos),
      dir,
    );
    const tr = this.view.state.tr.setSelection(selection).scrollIntoView();
    this.view.dispatch(tr);
    this.view.focus();
    return true;
  }

  forwardUpdate(update: ViewUpdate) {
    if (this.updating || !this.cm.hasFocus) {
      return;
    }
    let offset = this.getPos() + 1;
    const { main } = update.state.selection;
    const selFrom = offset + main.from;
    const selTo = offset + main.to;
    const pmSel = this.view.state.selection;
    if (update.docChanged || pmSel.from != selFrom || pmSel.to != selTo) {
      const tr = this.view.state.tr;
      update.changes.iterChanges((fromA, toA, fromB, toB, text) => {
        if (text.length) {
          tr.replaceWith(
            offset + fromA,
            offset + toA,
            this.view.state.schema.text(text.toString()),
          );
        } else {
          tr.delete(offset + fromA, offset + toA);
        }
        offset += toB - fromB - (toA - fromA);
      });
      tr.setSelection(TextSelection.create(tr.doc, selFrom, selTo));
      this.view.dispatch(tr);
    }
  }

  update(node: PMNode): boolean {
    console.log("node view update => ", node);
    if (node.type != this.node.type) {
      return false;
    }
    this.node = node;
    if (this.updating) return true;
    const newText = node.textContent;
    const curText = this.cm.state.doc.toString();
    if (newText != curText) {
      let start = 0;
      let curEnd = curText.length;
      let newEnd = newText.length;
      while (
        start < curEnd &&
        curText.charCodeAt(start) == newText.charCodeAt(start)
      ) {
        ++start;
      }
      while (
        curEnd > start &&
        newEnd > start &&
        curText.charCodeAt(curEnd - 1) == newText.charCodeAt(newEnd - 1)
      ) {
        curEnd--;
        newEnd--;
      }
      this.updating = true;
      this.cm.dispatch({
        changes: {
          from: start,
          to: curEnd,
          insert: newText.slice(start, newEnd),
        },
      });
      this.updating = false;
    }
    return true;
  }

  selectNode() {
    this.cm.focus();
  }

  stopEvent() {
    return true;
  }
}
