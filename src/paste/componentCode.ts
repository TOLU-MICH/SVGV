import * as vscode from "vscode";
import type { ElementNode } from "../converter/parser";
import { printComponent } from "../converter/component";
import { svgPropsImportInsertion } from "../converter/imports";
import { useTypeScript, type Settings } from "../settings";

export interface ComponentCode {
  text: string; // the component, to insert at the cursor
  importEdit: vscode.TextEdit | undefined; // the SVGProps import, if the file needs one
}

/** Everything needed to insert one SVG as a component into this document. */
export function componentCode(
  document: vscode.TextDocument,
  svg: ElementNode,
  name: string,
  settings: Settings,
): ComponentCode {
  const typescript = useTypeScript(document, settings);
  const text = printComponent(svg, { name, typescript, indent: "\t" });

  if (!typescript) {
    return { text, importEdit: undefined };
  }

  const insertion = svgPropsImportInsertion(document.getText());
  const importEdit = insertion
    ? vscode.TextEdit.insert(
        document.positionAt(insertion.offset),
        insertion.text,
      )
    : undefined;
  return { text, importEdit };
}
