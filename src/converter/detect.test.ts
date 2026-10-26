import { describe, it, expect } from "vitest";
import { findSvgElements } from "./detect";

const ICON =
  '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z"/></svg>';

describe("findSvgElements", () => {
  describe("accepts", () => {
    it("a single SVG", () => {
      expect(findSvgElements(ICON)).toHaveLength(1);
    });

    it("surrounding whitespace", () => {
      expect(findSvgElements(`\n  ${ICON}  \n`)).toHaveLength(1);
    });

    it("an XML declaration and comments", () => {
      const text = `<?xml version="1.0" encoding="UTF-8"?>\n<!-- exported -->\n${ICON}`;
      expect(findSvgElements(text)).toHaveLength(1);
    });

    it("several SVGs in a row", () => {
      expect(findSvgElements(`${ICON}\n${ICON}`)).toHaveLength(2);
    });
  });

  describe("rejects", () => {
    it("plain text", () => {
      expect(findSvgElements("hello world")).toBeNull();
    });

    it("code that contains SVG in a string", () => {
      expect(findSvgElements(`const icon = '${ICON}';`)).toBeNull();
    });

    it("SVG wrapped in HTML", () => {
      expect(findSvgElements(`<div>${ICON}</div>`)).toBeNull();
    });

    it("SVG followed by other text", () => {
      expect(findSvgElements(`${ICON} and more`)).toBeNull();
    });

    it("JSX with an expression attribute", () => {
      expect(
        findSvgElements("<svg style={{ opacity: 0.5 }}></svg>"),
      ).toBeNull();
    });

    it("JSX with spread props", () => {
      expect(findSvgElements("<svg {...props}></svg>")).toBeNull();
    });

    it("pastes over the size limit", () => {
      expect(findSvgElements(`<svg>${" ".repeat(200_001)}</svg>`)).toBeNull();
    });
  });
});
