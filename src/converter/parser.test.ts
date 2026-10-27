import { describe, it, expect } from "vitest";
import { parseXml, ParseError } from "./parser";

describe("parseXml", () => {
  describe("parses", () => {
    it("an element with attributes and a self-closing child", () => {
      expect(
        parseXml('<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>'),
      ).toEqual([
        {
          type: "element",
          name: "svg",
          attributes: [{ name: "viewBox", value: "0 0 24 24" }],
          children: [
            {
              type: "element",
              name: "path",
              attributes: [{ name: "d", value: "M0 0" }],
              children: [],
            },
          ],
        },
      ]);
    });

    it("single quotes, extra whitespace and attribute order", () => {
      const [svg] = parseXml(`<svg  width='24'\n  height = "24" ></svg>`);
      expect(svg).toMatchObject({
        attributes: [
          { name: "width", value: "24" },
          { name: "height", value: "24" },
        ],
      });
    });

    it("hyphenated and namespaced attribute names", () => {
      const [use] = parseXml('<use xlink:href="#a" stroke-width="2"/>');
      expect(use).toMatchObject({
        attributes: [
          { name: "xlink:href", value: "#a" },
          { name: "stroke-width", value: "2" },
        ],
      });
    });

    it("text, comments, CDATA and declarations", () => {
      const nodes = parseXml(
        '<?xml version="1.0"?><!-- hi --><style><![CDATA[.a{fill:red}]]></style>',
      );
      expect(nodes).toEqual([
        { type: "declaration", value: '<?xml version="1.0"?>' },
        { type: "comment", value: " hi " },
        {
          type: "element",
          name: "style",
          attributes: [],
          children: [{ type: "cdata", value: ".a{fill:red}" }],
        },
      ]);
    });

    it("text inside elements, with entities kept as-is", () => {
      const [title] = parseXml("<title>Tom &amp; Jerry</title>");
      expect(title).toMatchObject({
        children: [{ type: "text", value: "Tom &amp; Jerry" }],
      });
    });
  });

  describe("throws ParseError for", () => {
    const broken: Array<[string, string]> = [
      ["a mismatched closing tag", "<svg></g>"],
      ["a missing closing tag", "<svg><path/>"],
      ["a stray closing tag", "</svg>"],
      ["an unquoted attribute", "<svg width=24></svg>"],
      ["a JSX expression attribute", "<svg style={{ opacity: 1 }}></svg>"],
      ["JSX spread props", "<svg {...props}></svg>"],
      ["a duplicate attribute", '<svg a="1" a="2"></svg>'],
      ["attributes without whitespace between them", '<svg a="1"b="2"></svg>'],
      ["an unclosed comment", "<!-- oops"],
      ["an unclosed attribute value", '<svg a="1></svg>'],
    ];

    it.each(broken)("%s", (_description, input) => {
      expect(() => parseXml(input)).toThrow(ParseError);
    });
  });
});
