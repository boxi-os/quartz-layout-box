export type {
  BuildCtx,
  ChangeEvent,
  CSSResource,
  JSResource,
  ProcessedContent,
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
  QuartzPluginData,
  StaticResources,
} from "@quartz-community/types";

export interface LayoutBoxOptions {
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
}
