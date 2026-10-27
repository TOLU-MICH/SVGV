import * as assert from "assert";
import * as vscode from "vscode";
import {
  activateExtension,
  ICON,
  openEditor,
  resetAll,
  setSetting,
} from "./helpers.test";

suite("svg-v extension", () => {
  suiteSetup(activateExtension);
  teardown(resetAll);

  test("registers its commands", async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes("svg-v.pasteAsJsx"));
    assert.ok(commands.includes("svg-v.pasteAsComponent"));
  });

  test("Paste as Component inserts the component below the import", async () => {
    await setSetting("componentNaming", "infer"); // no name prompt, so the test can't get stuck
    const editor = await openEditor(
      "typescriptreact",
      "import { useState } from 'react';\n\n",
    );
    editor.selection = new vscode.Selection(2, 0, 2, 0);
    await vscode.env.clipboard.writeText(ICON);

    await vscode.commands.executeCommand("svg-v.pasteAsComponent");

    const text = editor.document.getText();
    const importAt = text.indexOf("import type { SVGProps } from 'react';");
    const componentAt = text.indexOf(
      "export function SvgIcon(props: SVGProps<SVGSVGElement>)",
    );
    assert.ok(importAt !== -1, "the import should be added");
    assert.ok(componentAt !== -1, "the component should be added");
    assert.ok(
      importAt < componentAt,
      "the import should come before the component",
    );
  });

  test("Paste as Component in an empty file still puts the import first", async () => {
    await setSetting("componentNaming", "infer");
    const editor = await openEditor("typescriptreact");
    await vscode.env.clipboard.writeText(ICON);

    await vscode.commands.executeCommand("svg-v.pasteAsComponent");

    assert.ok(
      editor.document
        .getText()
        .startsWith("import type { SVGProps } from 'react';"),
    );
  });

  test("Paste as Component suggests a new name when SvgIcon is taken", async () => {
    await setSetting("componentNaming", "infer");
    const editor = await openEditor(
      "typescriptreact",
      "export function SvgIcon() {}\n\n",
    );
    editor.selection = new vscode.Selection(2, 0, 2, 0);
    await vscode.env.clipboard.writeText(ICON);

    await vscode.commands.executeCommand("svg-v.pasteAsComponent");

    assert.match(editor.document.getText(), /export function SvgIcon2\(/);
  });

  test("Paste as Component leaves the file unchanged when the clipboard has no SVG", async () => {
    const editor = await openEditor("typescriptreact", "const x = 1;");
    await vscode.env.clipboard.writeText("not an svg");

    await vscode.commands.executeCommand("svg-v.pasteAsComponent");

    assert.strictEqual(editor.document.getText(), "const x = 1;");
  });
});
