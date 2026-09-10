import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { QuartzComponentProps } from "@quartz-community/types";
import LayoutBox from "../src/components/LayoutBox";
import type { LayoutBoxOptions } from "../src/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type VNode = { type: unknown; props: Record<string, any> };

let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "layout-box-"));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

function makeProps(overrides: Record<string, unknown> = {}): QuartzComponentProps {
  return {
    ctx: { argv: { serve: false } },
    fileData: { slug: "notes/page", frontmatter: { title: "Page <1>" } },
    cfg: { pageTitle: "Site" },
    externalResources: { css: [], js: [], additionalHead: [] },
    children: [],
    tree: {},
    allFiles: [],
    ...overrides,
  } as unknown as QuartzComponentProps;
}

function render(opts: LayoutBoxOptions, props = makeProps()): VNode | null {
  return LayoutBox({ dir, ...opts })(props) as VNode | null;
}

function children(node: VNode): VNode[] {
  const c = node.props.children;
  return (Array.isArray(c) ? c : [c]).filter((x) => x && typeof x === "object");
}

function contentHtml(node: VNode | null): string | undefined {
  if (!node) return undefined;
  const content = children(node).find((c) => c.props.dangerouslySetInnerHTML);
  return content?.props.dangerouslySetInnerHTML.__html;
}

function titleOf(node: VNode | null): string | undefined {
  if (!node) return undefined;
  const el = children(node).find((c) => c.type === "h3" || c.type === "summary");
  return el?.props.children;
}

function write(name: string, text: string) {
  fs.writeFileSync(path.join(dir, name), text);
}

describe("LayoutBox", () => {
  it("renders a snippet file with base and custom classes", () => {
    write("snippet.html", "<p>hi</p>");
    const node = render({ className: "extra" }, makeProps({ displayClass: "desktop-only" }));
    expect(node?.type).toBe("div");
    expect(node?.props.class).toBe("desktop-only layout-box extra");
    expect(contentHtml(node)).toBe("<p>hi</p>");
  });

  it("prefers inline html over the file", () => {
    write("snippet.html", "<p>file</p>");
    expect(contentHtml(render({ html: "<b>inline</b>" }))).toBe("<b>inline</b>");
  });

  it("renders nothing for a missing file outside serve mode", () => {
    expect(render({ file: "missing.html" })).toBeNull();
  });

  it("renders a visible hint for a missing file in serve mode", () => {
    const node = render({ file: "missing.html" }, makeProps({ ctx: { argv: { serve: true } } }));
    expect(node?.props.class).toContain("layout-box-missing");
  });

  it("refuses paths outside the snippet directory", () => {
    const outside = path.join(dir, "..", `outside-${path.basename(dir)}.html`);
    fs.writeFileSync(outside, "<p>x</p>");
    try {
      expect(render({ file: `../${path.basename(outside)}` })).toBeNull();
    } finally {
      fs.rmSync(outside, { force: true });
    }
  });

  it("refuses a symlink inside the snippet directory that points outside", () => {
    const outside = path.join(dir, "..", `secret-${path.basename(dir)}.html`);
    fs.writeFileSync(outside, "<p>secret</p>");
    fs.symlinkSync(outside, path.join(dir, "link.html"));
    try {
      expect(render({ file: "link.html" })).toBeNull();
    } finally {
      fs.rmSync(outside, { force: true });
    }
  });

  it("reads a snippet when the snippet directory itself is a symlink", () => {
    const real = fs.mkdtempSync(path.join(os.tmpdir(), "layout-box-real-"));
    const link = path.join(dir, "linked-dir");
    fs.writeFileSync(path.join(real, "snippet.html"), "<p>linked</p>");
    fs.symlinkSync(real, link);
    try {
      expect(contentHtml(render({ dir: link }))).toBe("<p>linked</p>");
    } finally {
      fs.rmSync(real, { recursive: true, force: true });
    }
  });

  it("renders nothing for empty content", () => {
    write("snippet.html", "  \n");
    expect(render({})).toBeNull();
  });

  it("re-reads the file when its mtime changes", () => {
    write("snippet.html", "<p>one</p>");
    const box = LayoutBox({ dir });
    expect(contentHtml(box(makeProps()) as VNode)).toBe("<p>one</p>");

    write("snippet.html", "<p>two</p>");
    const later = Date.now() / 1000 + 60;
    fs.utimesSync(path.join(dir, "snippet.html"), later, later);
    expect(contentHtml(box(makeProps()) as VNode)).toBe("<p>two</p>");
  });

  it("applies placeholders with escaping and can disable them", () => {
    write("snippet.html", "<h2>{{title}}</h2>");
    expect(contentHtml(render({}))).toBe("<h2>Page &lt;1&gt;</h2>");
    expect(contentHtml(render({ placeholders: false }))).toBe("<h2>{{title}}</h2>");
  });

  it("renders a title heading", () => {
    write("snippet.html", "<p>x</p>");
    const node = render({ title: "Info" });
    const heading = children(node!).find((c) => c.type === "h3");
    expect(heading?.props.children).toBe("Info");
  });

  it("renders a collapsible details element", () => {
    write("snippet.html", "<p>x</p>");
    const node = render({ title: "Info", collapsible: true, collapsed: true });
    expect(node?.type).toBe("details");
    expect(node?.props.open).toBe(false);
    expect(children(node!)[0]?.type).toBe("summary");
    expect(contentHtml(node)).toBe("<p>x</p>");
  });

  it("supports frontmatter control: hide, switch file, override html", () => {
    write("snippet.html", "<p>default</p>");
    write("other.html", "<p>other</p>");
    const withFm = (value: unknown) =>
      makeProps({ fileData: { slug: "a", frontmatter: { layoutBox: value } } });

    expect(render({}, withFm(false))).toBeNull();
    expect(contentHtml(render({}, withFm("other.html")))).toBe("<p>other</p>");
    expect(contentHtml(render({}, withFm({ html: "<i>fm</i>" })))).toBe("<i>fm</i>");
    expect(render({}, withFm({ hidden: true }))).toBeNull();
    expect(contentHtml(render({}, withFm("does-not-exist.html")))).toBeUndefined();
  });

  it("uses a custom frontmatter key", () => {
    write("snippet.html", "<p>default</p>");
    write("other.html", "<p>other</p>");
    const props = makeProps({
      fileData: { slug: "a", frontmatter: { layoutBox: false, sideBox: "other.html" } },
    });
    expect(contentHtml(render({ frontmatterKey: "sideBox" }, props))).toBe("<p>other</p>");
  });

  it("renders markdown snippets", () => {
    write("box.md", "## Hi {{title}}\n\n- a\n- b\n\n<span>raw</span>");
    const html = contentHtml(render({ file: "box.md" }));
    expect(html).toContain("<h2>Hi Page &lt;1&gt;</h2>");
    expect(html).toContain("<li>a</li>");
    expect(html).toContain("<span>raw</span>");
  });

  it("lets frontmatter override title, collapsible and collapsed", () => {
    write("snippet.html", "<p>x</p>");
    const props = makeProps({
      fileData: {
        slug: "a",
        frontmatter: { layoutBox: { title: "Page title", collapsible: true, collapsed: true } },
      },
    });
    const node = render({ title: "Base" }, props);
    expect(node?.type).toBe("details");
    expect(node?.props.open).toBe(false);
    expect(children(node!)[0]?.props.children).toBe("Page title");
  });

  it("applies placeholders to the title without double escaping", () => {
    write("snippet.html", "<p>x</p>");
    const props = makeProps({
      fileData: { slug: "a", frontmatter: { title: "A & B", boxTitle: "Box <1>" } },
    });
    const node = render({ title: "{{frontmatter.boxTitle}} / {{title}}" }, props);
    expect(titleOf(node)).toBe("Box <1> / A & B");
    expect(titleOf(render({ title: "{{title}}", placeholders: false }, props))).toBe("{{title}}");
  });

  describe("byLang", () => {
    const withLang = (lang: unknown, extra: Record<string, unknown> = {}) =>
      makeProps({
        fileData: { slug: "a", frontmatter: { title: "T", lang, ...extra } },
        cfg: { pageTitle: "Site", locale: "de-DE" },
      });
    const byLang = { en: { title: "About", file: "note.en.md" } };

    beforeEach(() => {
      write("note.md", "Über");
      write("note.en.md", "About text");
    });

    it("overrides title and file on an exact match", () => {
      const node = render({ title: "Über", file: "note.md", byLang }, withLang("en"));
      expect(titleOf(node)).toBe("About");
      expect(contentHtml(node)).toContain("About text");
    });

    it("matches the primary subtag and ignores case", () => {
      const node = render({ title: "Über", file: "note.md", byLang }, withLang("en-US"));
      expect(titleOf(node)).toBe("About");
      expect(contentHtml(node)).toContain("About text");

      const upper = render(
        { title: "Über", file: "note.md", byLang: { EN: byLang.en } },
        withLang("en"),
      );
      expect(titleOf(upper)).toBe("About");
    });

    it("keeps the base options when no entry matches", () => {
      const node = render({ title: "Über", file: "note.md", byLang }, withLang("fr"));
      expect(titleOf(node)).toBe("Über");
      expect(contentHtml(node)).toContain("Über");
    });

    it("falls back to cfg.locale when the page has no lang", () => {
      const props = makeProps({
        fileData: { slug: "a", frontmatter: {} },
        cfg: { pageTitle: "Site", locale: "en-US" },
      });
      expect(titleOf(render({ title: "Über", file: "note.md", byLang }, props))).toBe("About");
    });

    it("lets page frontmatter win over the language entry", () => {
      const props = withLang("en", { layoutBox: { title: "Page", file: "note.md" } });
      const node = render({ title: "Über", file: "note.md", byLang }, props);
      expect(titleOf(node)).toBe("Page");
      expect(contentHtml(node)).toContain("Über");
    });

    it("does not warn when collapsible and title live in the same byLang entry", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const node = render(
          { file: "note.md", byLang: { en: { collapsible: true, title: "About" } } },
          withLang("en"),
        );
        expect(node?.type).toBe("details");
        expect(warn).not.toHaveBeenCalled();
      } finally {
        warn.mockRestore();
      }
    });

    it("warns when a byLang entry makes the box collapsible without a title", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      try {
        render({ file: "note.md", byLang: { fr: { collapsible: true } } }, withLang("fr"));
        expect(warn).toHaveBeenCalledWith(expect.stringContaining("byLang.fr"));
      } finally {
        warn.mockRestore();
      }
    });
  });
});
