import type { QuartzComponentProps } from "@quartz-community/types";
import { escapeHTML } from "@quartz-community/utils/escape";

const PLACEHOLDER = /\{\{\s*([\w.-]+)\s*\}\}/g;
const FRONTMATTER_PREFIX = "frontmatter.";

export type PlaceholderContext = Pick<QuartzComponentProps, "fileData" | "cfg">;

/**
 * Replaces `{{name}}` tokens with page/site values. Values are HTML-escaped unless `escape` is
 * false — pass false where the caller inserts the result as a JSX text node, which escapes already.
 * Unknown placeholders are left untouched.
 */
export function applyPlaceholders(html: string, ctx: PlaceholderContext, escape = true): string {
  if (!html.includes("{{")) return html;
  return html.replace(PLACEHOLDER, (match, name: string) => {
    const value = resolvePlaceholder(name, ctx);
    if (value === undefined) return match;
    return escape ? escapeHTML(value) : value;
  });
}

function resolvePlaceholder(
  name: string,
  { fileData, cfg }: PlaceholderContext,
): string | undefined {
  const frontmatter = (fileData?.frontmatter ?? {}) as Record<string, unknown>;
  const slug = typeof fileData?.slug === "string" ? fileData.slug : undefined;

  switch (name) {
    case "title":
      return stringify(frontmatter.title);
    case "slug":
      return slug;
    case "root":
      return slug === undefined ? undefined : pathToRoot(slug);
    case "siteTitle":
      return cfg?.pageTitle;
    case "baseUrl":
      return cfg?.baseUrl ?? "";
    case "locale":
      // The page's own language when it has one, so a bilingual site labels each page correctly.
      return stringify(frontmatter.lang) ?? cfg?.locale;
    case "lang":
      // Just the primary subtag: "en" rather than "en-US", for a flag or a short label.
      return (stringify(frontmatter.lang) ?? cfg?.locale)?.split(/[-_]/)[0];
  }

  if (name.startsWith(FRONTMATTER_PREFIX)) {
    return stringify(frontmatter[name.slice(FRONTMATTER_PREFIX.length)]);
  }
  return undefined;
}

/** Relative path from a page slug to the site root (mirrors Quartz's `pathToRoot`). */
function pathToRoot(slug: string): string {
  const depth = slug.split("/").filter((segment) => segment !== "").length - 1;
  return depth <= 0 ? "." : Array(depth).fill("..").join("/");
}

function stringify(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value
      .map(stringify)
      .filter((v): v is string => v !== undefined)
      .join(", ");
  }
  return undefined;
}
