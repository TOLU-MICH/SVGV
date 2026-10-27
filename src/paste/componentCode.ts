import * as vscode from "vscode";
import type { ElementNode } from "../converter/parser";
import { printComponent } from "../converter/component";
import { placeSvgPropsImport } from "../converter/imports";
import { useTypeScript, type Settings } from "../settings";

export interface ComponentCode {
  text: string; // the component (and maybe the import), to insert at the cursor
  importEdit: vscode.TextEdit | undefined; // the SVGProps import, when it goes elsewhere in the file
}

/** Everything needed to insert one SVG as a component at position `at` in this document. */
export function componentCode(
  document: vscode.TextDocument,
  svg: ElementNode,
  name: string,
  settings: Settings,
  at: vscode.Position,
): ComponentCode {
  const typescript = useTypeScript(document, settings);
  const text = printComponent(svg, { name, typescript, indent: "\t" });

  if (!typescript) {
    return { text, importEdit: undefined };
  }

  const placement = placeSvgPropsImport(
    document.getText(),
    document.offsetAt(at),
  );
  switch (placement.kind) {
    case "none":
      return { text, importEdit: undefined };
    case "prefix":
      return { text: placement.text + text, importEdit: undefined };
    case "separate": {
      const { offset, text: importText } = placement.insertion;
      return {
        text,
        importEdit: vscode.TextEdit.insert(
          document.positionAt(offset),
          importText,
        ),
      };
    }
  }
}
