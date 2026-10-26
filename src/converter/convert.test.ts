import { describe, it, expect } from "vitest";
import { convertSvgToJsx } from "./convert";

// Joins lines so expected output reads like the code it represents.
const lines = (...rows: string[]) => rows.join("\n");

describe("convertSvgToJsx", () => {
  it("converts a real Figma icon export", () => {
    const figma = lines(
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
    );

    expect(convertSvgToJsx(figma)).toBe(
      lines(
        "<svg",
        '  width="24"',
        '  height="24"',
        '  viewBox="0 0 24 24"',
        '  fill="none"',
        '  xmlns="http://www.w3.org/2000/svg"',
        ">",
        "  <path",
        '    d="M12 2L2 7L12 12L22 7L12 2Z"',
        '    stroke="#1E1E1E"',
        '    strokeWidth="2"',
        '    strokeLinecap="round"',
        '    strokeLinejoin="round"',
        "  />",
        "</svg>",
      ),
    );
  });

  it("converts a Figma export with a clip path", () => {
    const figma = lines(
      '<svg viewBox="0 0 16 16" fill="none">',
      '<g clip-path="url(#clip0_1_2)">',
      '<path fill-rule="evenodd" clip-rule="evenodd" d="M0 0h16v16H0z" fill="black"/>',
      "</g>",
      "<defs>",
      '<clipPath id="clip0_1_2">',
      '<rect width="16" height="16" fill="white"/>',
      "</clipPath>",
      "</defs>",
      "</svg>",
    );

    expect(convertSvgToJsx(figma)).toBe(
      lines(
        '<svg viewBox="0 0 16 16" fill="none">',
        '  <g clipPath="url(#clip0_1_2)">',
        "    <path",
        '      fillRule="evenodd"',
        '      clipRule="evenodd"',
        '      d="M0 0h16v16H0z"',
        '      fill="black"',
        "    />",
        "  </g>",
        "  <defs>",
        '    <clipPath id="clip0_1_2">',
        '      <rect width="16" height="16" fill="white" />',
        "    </clipPath>",
        "  </defs>",
        "</svg>",
      ),
    );
  });

  it("self-closes empty elements", () => {
    expect(convertSvgToJsx('<svg><path d="M1 1"></path><g>  </g></svg>')).toBe(
      lines("<svg>", '  <path d="M1 1" />', "  <g />", "</svg>"),
    );
  });

  it("removes declarations and comments", () => {
    const text =
      '<?xml version="1.0"?>\n<!-- exported --><svg><!-- inner --><path d="M0 0"/></svg>';
    expect(convertSvgToJsx(text)).toBe(
      lines("<svg>", '  <path d="M0 0" />', "</svg>"),
    );
  });

  it("wraps several SVGs in a fragment", () => {
    expect(convertSvgToJsx('<svg id="a"/>\n<svg id="b"/>')).toBe(
      lines("<>", '  <svg id="a" />', '  <svg id="b" />', "</>"),
    );
  });

  describe("style", () => {
    it("turns style strings into objects", () => {
      expect(
        convertSvgToJsx('<svg style="opacity:0.5;mix-blend-mode:multiply"/>'),
      ).toBe(`<svg style={{ opacity: 0.5, mixBlendMode: 'multiply' }} />`);
    });

    it("quotes custom property keys and decodes entities in values", () => {
      expect(
        convertSvgToJsx(
          '<svg style="--c: red; font-family: &quot;A;B&quot;, sans-serif"/>',
        ),
      ).toBe(
        `<svg style={{ '--c': 'red', fontFamily: '"A;B", sans-serif' }} />`,
      );
    });

    it("escapes single quotes inside values", () => {
      expect(convertSvgToJsx(`<svg style="font-family: 'Inter'"/>`)).toBe(
        `<svg style={{ fontFamily: '\\'Inter\\'' }} />`,
      );
    });

    it("drops an empty style attribute", () => {
      expect(convertSvgToJsx('<svg style="" fill="none"/>')).toBe(
        '<svg fill="none" />',
      );
    });
  });

  describe("escaping", () => {
    it("writes double quotes in attribute values as &quot;", () => {
      expect(convertSvgToJsx(`<svg aria-label='Say "hi"'/>`)).toBe(
        '<svg aria-label="Say &quot;hi&quot;" />',
      );
    });

    it("escapes braces and > in text", () => {
      expect(
        convertSvgToJsx("<svg><title>a {b} &gt; c > d</title></svg>"),
      ).toBe(
        lines(
          "<svg>",
          "  <title>a &#123;b&#125; &gt; c &gt; d</title>",
          "</svg>",
        ),
      );
    });

    it("keeps CSS inside CDATA as a template literal", () => {
      expect(
        convertSvgToJsx("<svg><style><![CDATA[.a{fill:red}]]></style></svg>"),
      ).toBe(lines("<svg>", "  <style>{`.a{fill:red}`}</style>", "</svg>"));
    });

    it("keeps text and the spaces around it on one line", () => {
      expect(
        convertSvgToJsx(
          '<svg><text x="1">Hello <tspan>world</tspan></text></svg>',
        ),
      ).toBe(
        lines(
          "<svg>",
          '  <text x="1">Hello <tspan>world</tspan></text>',
          "</svg>",
        ),
      );
    });
  });

  it("uses the indentation it is given", () => {
    expect(
      convertSvgToJsx('<svg><path d="M0 0"/></svg>', { indent: "\t" }),
    ).toBe(lines("<svg>", '\t<path d="M0 0" />', "</svg>"));
  });

  it("returns null for text that is not SVG", () => {
    expect(convertSvgToJsx("const x = 1;")).toBeNull();
  });
});
