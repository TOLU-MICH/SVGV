import { describe, it, expect } from "vitest";
import { parseStyle } from "./style";

describe("parseStyle", () => {
  it("converts a single declaration", () => {
    expect(parseStyle("opacity:0.5")).toEqual({ opacity: 0.5 });
  });

  it("camelCases property names", () => {
    expect(parseStyle("mix-blend-mode: multiply")).toEqual({
      mixBlendMode: "multiply",
    });
  });

  it("handles several declarations, extra spaces and a trailing semicolon", () => {
    expect(parseStyle(" fill: #fff ; stroke-width:2; ")).toEqual({
      fill: "#fff",
      strokeWidth: 2,
    });
  });

  it("keeps values with units as strings", () => {
    expect(parseStyle("width: 12px; transform: rotate(45deg)")).toEqual({
      width: "12px",
      transform: "rotate(45deg)",
    });
  });

  it("splits only on the first colon", () => {
    expect(parseStyle("background: url(http://x.com/a.png)")).toEqual({
      background: "url(http://x.com/a.png)",
    });
  });

  it("follows React naming for vendor prefixes", () => {
    expect(parseStyle("-webkit-transform: none; -ms-transform: none")).toEqual({
      WebkitTransform: "none",
      msTransform: "none",
    });
  });

  it("keeps CSS custom properties unchanged", () => {
    expect(parseStyle("--icon-color: red")).toEqual({ "--icon-color": "red" });
  });

  it("ignores empty and malformed declarations", () => {
    expect(parseStyle(";;opacity:1; broken; :red")).toEqual({ opacity: 1 });
  });

  it("does not split on semicolons inside parentheses", () => {
    expect(
      parseStyle("background: url(data:image/png;base64,AAAA); opacity: 1"),
    ).toEqual({
      background: "url(data:image/png;base64,AAAA)",
      opacity: 1,
    });
  });

  it("does not split on semicolons inside quotes", () => {
    expect(parseStyle('font-family: "A;B", sans-serif; opacity: 1')).toEqual({
      fontFamily: '"A;B", sans-serif',
      opacity: 1,
    });
  });
});
