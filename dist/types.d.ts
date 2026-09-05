export { BuildCtx, CSSResource, ChangeEvent, JSResource, ProcessedContent, QuartzComponent, QuartzComponentConstructor, QuartzComponentProps, QuartzPluginData, StaticResources } from '@quartz-community/types';

interface LayoutBoxOptions {
    /** Snippet filename inside `dir`. Ignored when `html` is set. Defaults to `snippet.html`. */
    file?: string;
    /** Directory holding snippet files, relative to the site root. Defaults to `quartz/static/snippets`. */
    dir?: string;
    /** Inline HTML rendered instead of a snippet file. Takes precedence over `file`. */
    html?: string;
    /** Extra CSS class(es) added next to the fixed `layout-box` class. */
    className?: string;
    /** Heading rendered above the content (an `h3`, like other sidebar components). */
    title?: string;
    /** Wrap the box in `<details>`/`<summary>` using `title` as the summary. Defaults to `false`. */
    collapsible?: boolean;
    /** Start collapsed when `collapsible` is set. Defaults to `false`. */
    collapsed?: boolean;
    /** Replace `{{placeholder}}` tokens in the snippet. Defaults to `true`. */
    placeholders?: boolean;
    /** Frontmatter key used for per-page control. Defaults to `layoutBox`. */
    frontmatterKey?: string;
    /**
     * Per-language overrides, keyed by language code or locale (`en`, `en-US`; case-insensitive).
     * The entry matching the page's `frontmatter.lang` is merged over the base options.
     */
    byLang?: Record<string, LayoutBoxLangOptions>;
}
/**
 * Options that may be overridden per language. `dir` and `frontmatterKey` are excluded on purpose:
 * one is an installation path, the other the name a page uses to control the box — neither is a
 * question of language.
 */
type LayoutBoxLangOptions = Omit<LayoutBoxOptions, "byLang" | "dir" | "frontmatterKey">;

export type { LayoutBoxLangOptions, LayoutBoxOptions };
