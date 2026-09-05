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
import type { LayoutBoxLangOptions, LayoutBoxOptions } from "../types";
import style from "./styles/layout-box.scss";

const defaultOptions = {
  file: "snippet.html",
  dir: "quartz/static/snippets",
  placeholders: true,
  collapsible: false,
  collapsed: false,
  frontmatterKey: "layoutBox",
} satisfies LayoutBoxOptions;

type ResolvedOptions = LayoutBoxOptions &
  Required<Pick<LayoutBoxOptions, keyof typeof defaultOptions>>;
type Snippet = { mtimeMs: number; html: string };
type ReadResult = { ok: true; html: string } | { ok: false; reason: string };
type FrontmatterControl = {
  hidden?: boolean;
  file?: string;
  html?: string;
  title?: string;
  collapsible?: boolean;
  collapsed?: boolean;
};

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
      title: typeof obj.title === "string" ? obj.title : undefined,
      collapsible: typeof obj.collapsible === "boolean" ? obj.collapsible : undefined,
      collapsed: typeof obj.collapsed === "boolean" ? obj.collapsed : undefined,
    };
  }
  return {};
}

/** Lower-cases the `byLang` keys once, so the per-page lookup can be case-insensitive for free. */
function normalizeByLang(
  map: Record<string, LayoutBoxLangOptions> | undefined,
): Record<string, LayoutBoxLangOptions> | undefined {
  if (!map) return undefined;
  const normalized: Record<string, LayoutBoxLangOptions> = {};
  for (const [key, entry] of Object.entries(map)) {
    normalized[key.trim().toLowerCase()] = entry;
  }
  return normalized;
}

/**
 * The options for one page: the base options with the entry for the page's language merged over
 * them. `frontmatter.lang` is Quartz's own field — the one it renders `<html lang>` from — so this
 * needs no knowledge of any particular multilanguage plugin, and works just as well when the field
 * is written by hand.
 */
function optionsForPage(opts: ResolvedOptions, props: QuartzComponentProps): ResolvedOptions {
  const map = opts.byLang;
  if (!map) return opts;
  const raw = (props.fileData?.frontmatter as Record<string, unknown> | undefined)?.lang;
  const lang = String(raw ?? props.cfg?.locale ?? "")
    .trim()
    .toLowerCase();
  if (!lang) return opts;
  // Exact first ("en-us"), then the primary subtag ("en"): a config may key either way.
  const hit = map[lang] ?? map[lang.split(/[-_]/)[0] ?? ""];
  return hit ? { ...opts, ...hit } : opts;
}

export default ((userOpts?: LayoutBoxOptions) => {
  const opts: ResolvedOptions = {
    ...defaultOptions,
    ...userOpts,
    byLang: normalizeByLang(userOpts?.byLang),
  };

  // Checked per variant at construction so the mistake is reported before any page renders.
  const variants: [string, ResolvedOptions][] = [["", opts]];
  for (const [lang, entry] of Object.entries(opts.byLang ?? {})) {
    variants.push([lang, { ...opts, ...entry }]);
  }
  for (const [lang, variant] of variants) {
    if (variant.collapsible && !variant.title) {
      warnOnce(
        `collapsible-without-title:${lang}`,
        `\`collapsible\` requires a \`title\`${lang ? ` (byLang.${lang})` : ""}; rendering non-collapsible.`,
      );
    }
  }

  const LayoutBox: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, displayClass } = props;
    const control = readFrontmatterControl(fileData?.frontmatter, opts.frontmatterKey);
    if (control.hidden) return null;
    const page = optionsForPage(opts, props);

    let html: string;
    const inline = control.html ?? page.html;
    if (inline !== undefined) {
      html = inline;
    } else {
      const file = control.file ?? page.file;
      const absPath = resolveSnippetPath(page.dir, file);
      if (absPath === null) return null;

      const result = readSnippet(absPath);
      if (!result.ok) {
        warnOnce(`read:${absPath}`, `${result.reason}: ${absPath}`);
        const ctx = props.ctx as BuildCtx | undefined;
        if (!ctx?.argv?.serve) return null;
        return (
          <div class={classNames(displayClass, "layout-box", "layout-box-missing", page.className)}>
            Layout Box: {result.reason.toLowerCase()}:{" "}
            <code>{path.relative(process.cwd(), absPath)}</code>
          </div>
        );
      }
      html = result.html;
    }

    if (page.placeholders) html = applyPlaceholders(html, props);
    if (html.trim() === "") return null;

    // The title is a JSX text node, which Preact escapes itself, so placeholders stay unescaped here.
    let title = control.title ?? page.title;
    if (title && page.placeholders) title = applyPlaceholders(title, props, false);
    const collapsible = control.collapsible ?? page.collapsible;
    const collapsed = control.collapsed ?? page.collapsed;

    const boxClass = classNames(displayClass, "layout-box", page.className);
    const content = <div class="layout-box-content" dangerouslySetInnerHTML={{ __html: html }} />;

    if (collapsible && title) {
      return (
        <details class={boxClass} open={!collapsed}>
          <summary class="layout-box-title">{title}</summary>
          {content}
        </details>
      );
    }

    return (
      <div class={boxClass}>
        {title && <h3 class="layout-box-title">{title}</h3>}
        {content}
      </div>
    );
  };

  LayoutBox.css = style;
  return LayoutBox;
}) satisfies QuartzComponentConstructor<LayoutBoxOptions>;
