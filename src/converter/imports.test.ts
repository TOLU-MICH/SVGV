import { describe, it, expect } from "vitest";
import {
  SVG_PROPS_IMPORT,
  placeSvgPropsImport,
  svgPropsImportInsertion,
} from "./imports";

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

  describe("placeSvgPropsImport", () => {
    it("puts the import in front of the component in an empty file", () => {
      expect(placeSvgPropsImport("", 0)).toEqual({
        kind: "prefix",
        text: `${SVG_PROPS_IMPORT}\n\n`,
      });
    });

    it("puts the import in front of the component when pasting above the imports", () => {
      const source = lines("", "import { useState } from 'react';");
      expect(placeSvgPropsImport(source, 0)).toMatchObject({ kind: "prefix" });
    });

    it("uses a separate edit when pasting below the imports", () => {
      const source = lines("import { useState } from 'react';", "", "");
      expect(placeSvgPropsImport(source, source.length)).toEqual({
        kind: "separate",
        insertion: {
          offset: "import { useState } from 'react';".length,
          text: `\n${SVG_PROPS_IMPORT}`,
        },
      });
    });

    it("does nothing when the file already imports SVGProps", () => {
      const source = lines("import type { SVGProps } from 'react';", "", "");
      expect(placeSvgPropsImport(source, source.length)).toEqual({
        kind: "none",
      });
    });
  });
});
