import { describe, it, expect } from "vitest";
import { SVG_PROPS_IMPORT, svgPropsImportInsertion } from "./imports";

// Applies the insertion, so tests can compare whole files.
function withImport(source: string): string {
  const insertion = svgPropsImportInsertion(source);
  if (insertion === null) {
    return source;
  }
  return (
    source.slice(0, insertion.offset) +
    insertion.text +
    source.slice(insertion.offset)
  );
}

const lines = (...rows: string[]) => rows.join("\n");

describe("svgPropsImportInsertion", () => {
  it("adds the import after the last existing import", () => {
    const source = lines(
      "import { useState } from 'react';",
      "import './app.css';",
      "",
      "export const x = 1;",
    );
    expect(withImport(source)).toBe(
      lines(
        "import { useState } from 'react';",
        "import './app.css';",
        SVG_PROPS_IMPORT,
        "",
        "export const x = 1;",
      ),
    );
  });

  it("handles multi-line imports", () => {
    const source = lines(
      "import {",
      "  a,",
      "  b,",
      "} from './lib';",
      "",
      "const x = 1;",
    );
    expect(withImport(source)).toBe(
      lines(
        "import {",
        "  a,",
        "  b,",
        "} from './lib';",
        SVG_PROPS_IMPORT,
        "",
        "const x = 1;",
      ),
    );
  });

  it("keeps 'use client' first in files without imports", () => {
    expect(withImport(lines("'use client';", "", "const x = 1;"))).toBe(
      lines("'use client';", "", SVG_PROPS_IMPORT, "", "const x = 1;"),
    );
  });

  it("adds the import at the top of a file without imports", () => {
    expect(withImport("const x = 1;")).toBe(
      lines(SVG_PROPS_IMPORT, "", "const x = 1;"),
    );
  });

  it.each([
    "import type { SVGProps } from 'react';",
    'import React, { type SVGProps } from "react";',
    "import { useState, SVGProps } from 'react';",
  ])("does nothing when it is already imported: %s", (existing) => {
    expect(svgPropsImportInsertion(`${existing}\nconst x = 1;`)).toBeNull();
  });
});
