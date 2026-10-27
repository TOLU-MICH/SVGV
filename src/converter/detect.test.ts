import { describe, it, expect } from "vitest";
import { detectSvg, findSvgElements } from "./detect";

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

describe("detectSvg", () => {
  it("reports SVG it can convert", () => {
    expect(detectSvg(ICON)).toMatchObject({ kind: "svg" });
  });

  it.each([
    ["a missing closing tag", '<svg viewBox="0 0 10 10"><path d="M0 0">'],
    ["a copy that was cut off", '<svg viewBox="0 0 10 10"><path d="M0'],
    ["an XML file with a broken SVG", '<?xml version="1.0"?><svg><g></svg>'],
  ])("reports %s as invalid, with a reason", (_description, text) => {
    const detection = detectSvg(text);
    expect(detection.kind).toBe("invalid");
    expect(detection.kind === "invalid" && detection.reason).toBeTruthy();
  });

  it("reports an SVG over the size limit as invalid", () => {
    expect(detectSvg(`<svg>${" ".repeat(200_001)}</svg>`)).toEqual({
      kind: "invalid",
      reason: "it is larger than 200 KB",
    });
  });

  it.each([
    ["plain text", "hello"],
    [
      "JSX copied from a component",
      '<svg className="x" {...props}><path d="M0 0" /></svg>',
    ],
    ["JSX with a style object", "<svg style={{ opacity: 1 }}>"],
    ["HTML that contains an SVG", "<div><svg></svg></div>"],
    ["a broken HTML snippet", "<div><svg>"],
  ])("stays quiet about %s", (_description, text) => {
    expect(detectSvg(text)).toEqual({ kind: "other" });
  });
});
