export const SVG_PROPS_IMPORT = "import type { SVGProps } from 'react';";

// An import of SVGProps from 'react', in any form:
// import type { SVGProps } from 'react' / import React, { type SVGProps } from "react"
const HAS_SVG_PROPS_IMPORT =
  /\bimport\b[^;]*?\bSVGProps\b[^;]*?\bfrom\s*['"]react['"]/;

// A whole import statement, including multi-line ones and side-effect imports like import './app.css'.
const IMPORT_STATEMENT = /^import\s(?:[\s\S]*?\sfrom\s*)??['"][^'"\n]*['"];?/gm;

// 'use client' / 'use server' must stay the very first statement in the file (Next.js).
const DIRECTIVE = /^\s*(['"])use (?:client|server)\1;?/;

export interface Insertion {
  offset: number; // character position in the file
  text: string;
}

/** Where and what to insert so the file imports SVGProps, or null if it already does. */
export function svgPropsImportInsertion(source: string): Insertion | null {
  if (HAS_SVG_PROPS_IMPORT.test(source)) {
    return null;
  }

  const imports = [...source.matchAll(IMPORT_STATEMENT)];
  const lastImport = imports.at(-1);
  if (lastImport) {
    return {
      offset: lastImport.index + lastImport[0].length,
      text: `\n${SVG_PROPS_IMPORT}`,
    };
  }

  const directive = DIRECTIVE.exec(source);
  if (directive) {
    return {
      offset: directive.index + directive[0].length,
      text: `\n\n${SVG_PROPS_IMPORT}`,
    };
  }

  return { offset: 0, text: `${SVG_PROPS_IMPORT}\n\n` };
}
