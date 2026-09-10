import { describe, expect, it } from "vitest";
import { applyPlaceholders, type PlaceholderContext } from "../src/placeholders";

const ctx = {
  fileData: {
    slug: "notes/deep/page",
    frontmatter: { title: "Hello & <World>", tags: ["a", "b"], count: 3, nested: { x: 1 } },
  },
  cfg: { pageTitle: "My Site", baseUrl: "example.com/sub", locale: "de-DE" },
} as unknown as PlaceholderContext;

describe("applyPlaceholders", () => {
  it("replaces page and site placeholders", () => {
    const html = "{{title}}|{{slug}}|{{root}}|{{siteTitle}}|{{baseUrl}}|{{locale}}";
    expect(applyPlaceholders(html, ctx)).toBe(
      "Hello &amp; &lt;World&gt;|notes/deep/page|../..|My Site|example.com/sub|de-DE",
    );
  });

  it("resolves frontmatter keys and joins arrays", () => {
    expect(applyPlaceholders("{{frontmatter.tags}} {{ frontmatter.count }}", ctx)).toBe("a, b 3");
  });

  it("leaves unknown placeholders and objects untouched", () => {
    const html = "{{nope}} {{frontmatter.missing}} {{frontmatter.nested}}";
    expect(applyPlaceholders(html, ctx)).toBe(html);
  });

  it("resolves locale and lang from the page, falling back to the site locale", () => {
    expect(applyPlaceholders("{{locale}}|{{lang}}", ctx)).toBe("de-DE|de");
    const page = {
      ...ctx,
      fileData: { slug: "en/page", frontmatter: { lang: "en-US" } },
    } as PlaceholderContext;
    expect(applyPlaceholders("{{locale}}|{{lang}}", page)).toBe("en-US|en");
    const none = { fileData: { slug: "x", frontmatter: {} } } as PlaceholderContext;
    expect(applyPlaceholders("{{locale}}|{{lang}}", none)).toBe("{{locale}}|{{lang}}");
  });

  it("can skip escaping for callers that escape themselves", () => {
    expect(applyPlaceholders("{{title}}", ctx, false)).toBe("Hello & <World>");
  });

  // What a Markdown renderer leaves behind: `[x]({{root}}/y)` arrives with the braces
  // percent-encoded, and the placeholder used to stay spelled out in the href.
  it("replaces placeholders that a Markdown link left percent-encoded", () => {
    expect(applyPlaceholders("%7B%7Broot%7D%7D/ueber", ctx)).toBe("../../ueber");
    expect(applyPlaceholders("%7b%7bslug%7d%7d", ctx)).toBe("notes/deep/page");
    expect(applyPlaceholders("%7B%7B%20root%20%7D%7D/x", ctx)).toBe("../../x");
  });

  it("leaves encoded text alone when it is not a placeholder", () => {
    expect(applyPlaceholders("%7B%7Bnot a name%7D%7D", ctx)).toBe("%7B%7Bnot a name%7D%7D");
    expect(applyPlaceholders("%7B%7Bunknown%7D%7D", ctx)).toBe("{{unknown}}");
    expect(applyPlaceholders("nothing to do here", ctx)).toBe("nothing to do here");
  });

  it("returns root as '.' for top-level pages", () => {
    const top = { ...ctx, fileData: { slug: "index", frontmatter: {} } } as PlaceholderContext;
    expect(applyPlaceholders("{{root}}/static/x.png", top)).toBe("./static/x.png");
  });
});
