import fs from "node:fs";
import path from "node:path";
import type {
  BuildCtx,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "@quartz-community/types";
import { classNames } from "../util/lang";
import { applyPlaceholders } from "../placeholders";
import { renderMarkdown } from "../markdown";
import type { LayoutBoxOptions } from "../types";
import style from "./styles/layout-box.scss";

const defaultOptions = {
  file: "snippet.html",
  dir: "quartz/static/snippets",
  placeholders: true,
  collapsible: false,
  collapsed: false,
  frontmatterKey: "layoutBox",
} satisfies LayoutBoxOptions;

type Snippet = { mtimeMs: number; html: string };
type ReadResult = { ok: true; html: string } | { ok: false; reason: string };
type FrontmatterControl = { hidden?: boolean; file?: string; html?: string };

/** Cache keyed by absolute path; entries are refreshed when the file's mtime changes. */
const snippetCache = new Map<string, Snippet>();
const warned = new Set<string>();

function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[layout-box] ${message}`);
}

/** Resolves `file` inside `dir` (relative to the site root). Returns null if it escapes `dir`. */
function resolveSnippetPath(dir: string, file: string): string | null {
  const baseDir = path.resolve(process.cwd(), dir);
  const absPath = path.resolve(baseDir, file);
  const rel = path.relative(baseDir, absPath);
  if (rel === "" || rel.startsWith("..") || path.isAbsolute(rel)) {
    warnOnce(`escape:${absPath}`, `Refusing to read "${file}" outside of "${dir}".`);
    return null;
  }
  return absPath;
}

function readSnippet(absPath: string): ReadResult {
  let mtimeMs: number;
  try {
    mtimeMs = fs.statSync(absPath).mtimeMs;
  } catch {
    return { ok: false, reason: "Snippet file not found" };
  }

  const cached = snippetCache.get(absPath);
  if (cached && cached.mtimeMs === mtimeMs) {
    return { ok: true, html: cached.html };
  }

  let raw: string;
  try {
    raw = fs.readFileSync(absPath, "utf-8");
  } catch (error) {
    return { ok: false, reason: `Could not read snippet file (${String(error)})` };
  }

  const html = absPath.toLowerCase().endsWith(".md") ? renderMarkdown(raw) : raw;
  snippetCache.set(absPath, { mtimeMs, html });
  return { ok: true, html };
}

function readFrontmatterControl(frontmatter: unknown, key: string): FrontmatterControl {
  if (!frontmatter || typeof frontmatter !== "object") return {};
  const value = (frontmatter as Record<string, unknown>)[key];
  if (value === false) return { hidden: true };
  if (typeof value === "string") return { file: value };
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return {
      hidden: obj.hidden === true,
      file: typeof obj.file === "string" ? obj.file : undefined,
      html: typeof obj.html === "string" ? obj.html : undefined,
    };
  }
  return {};
}

export default ((userOpts?: LayoutBoxOptions) => {
  const opts = { ...defaultOptions, ...userOpts };

  if (opts.collapsible && !opts.title) {
    warnOnce(
      "collapsible-without-title",
      "`collapsible` requires a `title`; rendering non-collapsible.",
    );
  }

  const LayoutBox: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, displayClass } = props;
    const control = readFrontmatterControl(fileData?.frontmatter, opts.frontmatterKey);
    if (control.hidden) return null;

    let html: string;
    const inline = control.html ?? opts.html;
    if (inline !== undefined) {
      html = inline;
    } else {
      const file = control.file ?? opts.file;
      const absPath = resolveSnippetPath(opts.dir, file);
      if (absPath === null) return null;

      const result = readSnippet(absPath);
      if (!result.ok) {
        warnOnce(`read:${absPath}`, `${result.reason}: ${absPath}`);
        const ctx = props.ctx as BuildCtx | undefined;
        if (!ctx?.argv?.serve) return null;
        return (
          <div class={classNames(displayClass, "layout-box", "layout-box-missing", opts.className)}>
            Layout Box: {result.reason.toLowerCase()}:{" "}
            <code>{path.relative(process.cwd(), absPath)}</code>
          </div>
        );
      }
      html = result.html;
    }

    if (opts.placeholders) html = applyPlaceholders(html, props);
    if (html.trim() === "") return null;

    const boxClass = classNames(displayClass, "layout-box", opts.className);
    const content = <div class="layout-box-content" dangerouslySetInnerHTML={{ __html: html }} />;

    if (opts.collapsible && opts.title) {
      return (
        <details class={boxClass} open={!opts.collapsed}>
          <summary class="layout-box-title">{opts.title}</summary>
          {content}
        </details>
      );
    }

    return (
      <div class={boxClass}>
        {opts.title && <h3 class="layout-box-title">{opts.title}</h3>}
        {content}
      </div>
    );
  };

  LayoutBox.css = style;
  return LayoutBox;
}) satisfies QuartzComponentConstructor<LayoutBoxOptions>;
