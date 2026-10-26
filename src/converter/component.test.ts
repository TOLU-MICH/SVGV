import { describe, it, expect } from "vitest";
import { findSvgElements } from "./detect";
import {
  inferComponentName,
  isValidComponentName,
  printComponent,
  toComponentName,
} from "./components";
import type { ElementNode } from "./parser";

const lines = (...rows: string[]) => rows.join("\n");

// Test helper: parse one SVG, failing loudly if the input isn't one.
function svg(text: string): ElementNode {
  const svgs = findSvgElements(text);
  if (svgs?.length !== 1) {
    throw new Error("Expected exactly one SVG");
  }
  return svgs[0];
}

describe("printComponent", () => {
  const icon = svg('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');

  it("prints a typed component for TypeScript", () => {
    expect(printComponent(icon, { name: "ArrowIcon", typescript: true })).toBe(
      lines(
        "export function ArrowIcon(props: SVGProps<SVGSVGElement>) {",
        "  return (",
        '    <svg viewBox="0 0 24 24" {...props}>',
        '      <path d="M0 0" />',
        "    </svg>",
        "  );",
        "}",
      ),
    );
  });

  it("prints an untyped component for JavaScript", () => {
    expect(
      printComponent(icon, { name: "ArrowIcon", typescript: false }),
    ).toContain("export function ArrowIcon(props) {");
  });

  it("puts {...props} on its own line when the tag is long", () => {
    const wide = svg(
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"/>',
    );
    expect(printComponent(wide, { name: "Logo", typescript: false })).toContain(
      lines(
        '      xmlns="http://www.w3.org/2000/svg"',
        "      {...props}",
        "    />",
      ),
    );
  });

  it("uses the indentation it is given", () => {
    expect(
      printComponent(icon, { name: "A", typescript: false, indent: "\t" }),
    ).toContain('\t\t<svg viewBox="0 0 24 24" {...props}>');
  });

  it("refuses invalid names", () => {
    expect(() =>
      printComponent(icon, { name: "arrow", typescript: true }),
    ).toThrow();
  });
});

describe("component names", () => {
  it.each([
    ["arrow-left", "ArrowLeft"],
    ["Arrow Left", "ArrowLeft"],
    ["arrow_left", "ArrowLeft"],
    ["arrowLeft", "ArrowLeft"],
    ["24px", "Icon24px"],
  ])('turns "%s" into %s', (text, expected) => {
    expect(toComponentName(text)).toBe(expected);
  });

  it("returns null when nothing usable is left", () => {
    expect(toComponentName(" -- ")).toBeNull();
  });

  it("infers the name from <title> first, then id, then a fallback", () => {
    expect(
      inferComponentName(
        svg('<svg id="logo"><title>close button</title></svg>'),
      ),
    ).toBe("CloseButton");
    expect(inferComponentName(svg('<svg id="main-logo"/>'))).toBe("MainLogo");
    expect(inferComponentName(svg("<svg/>"))).toBe("SvgIcon");
  });

  it("validates names typed by the user", () => {
    expect(isValidComponentName("ArrowIcon")).toBe(true);
    expect(isValidComponentName("arrowIcon")).toBe(false);
    expect(isValidComponentName("Arrow Icon")).toBe(false);
    expect(isValidComponentName("")).toBe(false);
  });
});
