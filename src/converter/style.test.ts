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

  it("does not end a quote at an escaped quote", () => {
    expect(parseStyle('content: "a\\"; b"; opacity: 1')).toEqual({
      content: '"a\\"; b"',
      opacity: 1,
    });
  });

  it("does not split on an escaped semicolon", () => {
    expect(parseStyle("font-family: a\\;b; opacity: 1")).toEqual({
      fontFamily: "a\\;b",
      opacity: 1,
    });
  });

  it("keeps bare numbers as strings where React would add px", () => {
    expect(parseStyle("width: 10; height: 2.5")).toEqual({
      width: "10",
      height: "2.5",
    });
  });

  it("uses numbers for zero, since React never adds px to it", () => {
    expect(parseStyle("width: 0; margin: -0")).toEqual({ width: 0, margin: -0 });
  });

  it("does not treat custom properties as unitless", () => {
    expect(parseStyle("--size: 4")).toEqual({ "--size": "4" });
  });
});
