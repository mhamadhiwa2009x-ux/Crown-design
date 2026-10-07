import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Crown Design document metadata", () => {
  it("uses Crown Design for title and social-sharing fields", () => {
    const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

    expect(html).toContain("<title>Crown Design</title>");
    expect(html).toContain('<meta property="og:title" content="Crown Design" />');
    expect(html).toContain('<meta property="og:site_name" content="Crown Design" />');
    expect(html).toContain('<meta name="twitter:title" content="Crown Design" />');
    expect(html).not.toContain("Brand Shopping Store");
  });
});


