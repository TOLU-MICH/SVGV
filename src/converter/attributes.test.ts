import { describe, it, expect } from "vitest";
import { toJsxAttributeName } from "./attributes";

describe("toJsxAttributeName", () => {
  it("renames class and for", () => {
    expect(toJsxAttributeName("class")).toBe("className");
    expect(toJsxAttributeName("for")).toBe("htmlFor");
  });

  it("camelCases hyphenated attributes", () => {
    expect(toJsxAttributeName("stroke-width")).toBe("strokeWidth");
    expect(toJsxAttributeName("fill-rule")).toBe("fillRule");
    expect(toJsxAttributeName("stroke-dasharray")).toBe("strokeDasharray");
  });

  it("camelCases namespaced attributes", () => {
    expect(toJsxAttributeName("xlink:href")).toBe("xlinkHref");
    expect(toJsxAttributeName("xml:space")).toBe("xmlSpace");
    expect(toJsxAttributeName("xmlns:xlink")).toBe("xmlnsXlink");
  });

  it("keeps data-* and aria-* unchanged", () => {
    expect(toJsxAttributeName("data-name")).toBe("data-name");
    expect(toJsxAttributeName("aria-hidden")).toBe("aria-hidden");
  });

  it("leaves already-valid names alone", () => {
    expect(toJsxAttributeName("viewBox")).toBe("viewBox");
    expect(toJsxAttributeName("d")).toBe("d");
  });
});
