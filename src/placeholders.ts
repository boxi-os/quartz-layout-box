import type { QuartzComponentProps } from "@quartz-community/types";
import { escapeHTML } from "@quartz-community/utils/escape";

const PLACEHOLDER = /\{\{\s*([\w.-]+)\s*\}\}/g;
// The same token after a Markdown renderer has put it into a URL. `[x]({{root}}/y)` becomes an
// `href`, and percent-encoding the braces is part of that - so by the time this file sees the
// snippet, `{{root}}` reads `%7B%7Broot%7D%7D` and the pattern above no longer matches. Measured on
// 2026-09-10 across four sites at once: every link in a Markdown snippet arrived with the
// placeholder spelled out and pointed nowhere.
const ENCODED_PLACEHOLDER = /%7B%7B([\w.\-%20]*?)%7D%7D/gi;
const FRONTMATTER_PREFIX = "frontmatter.";

export type PlaceholderContext = Pick<QuartzComponentProps, "fileData" | "cfg">;

/**
 * Replaces `{{name}}` tokens with page/site values. Values are HTML-escaped unless `escape` is
 * false — pass false where the caller inserts the result as a JSX text node, which escapes already.
 * Unknown placeholders are left untouched.
 */
export function applyPlaceholders(html: string, ctx: PlaceholderContext, escape = true): string {
  if (!html.includes("{{") && !/%7B%7B/i.test(html)) return html;
  // Turn the encoded form back into the plain one first, so both take the same path below and a
  // value only ever has to be escaped once. `%20` inside stands for the space a writer may have
  // left in `{{ root }}`.
  const plain = html.replace(ENCODED_PLACEHOLDER, (match, inner: string) => {
    const name = inner.replace(/%20/gi, " ").trim();
    // As conservative as the plain spelling. Turning the token back is a change to the document -
    // `%7B%7B…%7D%7D` is a valid URL, `{{…}}` is raw braces in an href - so it only happens for a
    // name that is actually going to be replaced below. An empty or unknown name stays as it is,
    // which is what the plain spelling does too.
    if (!/^[\w.-]+$/.test(name) || resolvePlaceholder(name, ctx) === undefined) return match;
    return `{{${inner.replace(/%20/gi, " ")}}}`;
  });
  return plain.replace(PLACEHOLDER, (match, name: string) => {
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
