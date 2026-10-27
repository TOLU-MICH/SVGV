import * as assert from "assert";
import * as vscode from "vscode";
import { SvgPasteProvider } from "../paste/svgPasteProvider";
import { ICON, openEditor, resetAll, setSetting } from "./helpers.test";

suite("SvgPasteProvider", () => {
  const provider = new SvgPasteProvider(
    vscode.window.createOutputChannel("svg-v tests", { log: true }),
  );

  // Simulates a paste of `text` at `position`, the same way VS Code calls our provider.
  async function paste(
    editor: vscode.TextEditor,
    text: string,
    position = new vscode.Position(0, 0),
    triggerKind = vscode.DocumentPasteTriggerKind.Automatic,
  ): Promise<vscode.DocumentPasteEdit[] | undefined> {
    const dataTransfer = new vscode.DataTransfer();
    dataTransfer.set("text/plain", new vscode.DataTransferItem(text));
    const result = await provider.provideDocumentPasteEdits(
      editor.document,
      [new vscode.Range(position, position)],
      dataTransfer,
      { triggerKind, only: undefined },
      new vscode.CancellationTokenSource().token,
    );
    return result ?? undefined;
  }

  const kinds = (edits: vscode.DocumentPasteEdit[] | undefined) =>
    edits?.map((edit) => edit.kind.value);

  teardown(resetAll);

  test("offers inline JSX first, then a component, in a .tsx file", async () => {
    const edits = await paste(await openEditor("typescriptreact"), ICON);
    assert.deepStrictEqual(kinds(edits), [
      "jsx.svg.inline",
      "jsx.svg.component",
    ]);
    assert.match(String(edits?.[0].insertText), /strokeWidth="2"/);
  });

  test('puts the component first when outputFormat is "component"', async () => {
    await setSetting("outputFormat", "component");
    const edits = await paste(await openEditor("typescriptreact"), ICON);
    assert.deepStrictEqual(kinds(edits), [
      "jsx.svg.component",
      "jsx.svg.inline",
    ]);
  });

  test("leaves text that is not SVG alone", async () => {
    assert.strictEqual(
      await paste(await openEditor("typescriptreact"), "const x = 1;"),
      undefined,
    );
  });

  test("leaves a normal paste alone when auto-paste is off", async () => {
    await setSetting("autoPasteEnabled", false);
    assert.strictEqual(
      await paste(await openEditor("typescriptreact"), ICON),
      undefined,
    );
  });

  test('still converts for "Paste As..." when auto-paste is off', async () => {
    await setSetting("autoPasteEnabled", false);
    const editor = await openEditor("typescriptreact");
    const edits = await paste(
      editor,
      ICON,
      undefined,
      vscode.DocumentPasteTriggerKind.PasteAs,
    );
    assert.strictEqual(edits?.length, 2);
  });

  test("converts in .js files only when includeJsFiles is on", async () => {
    assert.strictEqual(
      await paste(await openEditor("javascript"), ICON),
      undefined,
    );

    await setSetting("includeJsFiles", true);
    assert.strictEqual(
      (await paste(await openEditor("javascript"), ICON))?.length,
      2,
    );
  });

  test("adds the SVGProps import as a separate edit below existing imports", async () => {
    const editor = await openEditor(
      "typescriptreact",
      "import { useState } from 'react';\n\n",
    );
    const [, component] =
      (await paste(editor, ICON, new vscode.Position(2, 0))) ?? [];

    const importEdits =
      component?.additionalEdit?.get(editor.document.uri) ?? [];
    assert.strictEqual(importEdits.length, 1);
    assert.match(
      importEdits[0].newText,
      /import type \{ SVGProps \} from 'react';/,
    );
  });

  test("gives untyped components without an import in .jsx files", async () => {
    const [, component] =
      (await paste(await openEditor("javascriptreact"), ICON)) ?? [];
    assert.match(
      String(component?.insertText),
      /export function SvgIcon\(props\) \{/,
    );
    assert.strictEqual(component?.additionalEdit, undefined);
  });
});
