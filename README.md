# quartz-layout-box

A [Quartz v5](https://quartz.jzhao.xyz) component plugin that renders an HTML or Markdown snippet
anywhere in the page layout: sidebar, header, footer, before or after the body. Use it for a site
title block, a logo, a call-to-action, a notice, or any small piece of static markup you don't want
to hard-code into a theme.

- Snippet from a file (`quartz/static/snippets/` by default) or inline in `quartz.config.yaml`
- Markdown snippets (`.md`) are rendered at build time
- `{{placeholders}}` for page title, slug, site title, root path and frontmatter values
- Optional heading and collapsible `<details>` box, no client-side JavaScript
- Per-page control via frontmatter (hide the box, switch the snippet or the title)
- Per-language options (`byLang`) for bilingual sites, keyed on the page's `lang`
- Snippet changes are picked up in `quartz build --serve` without a restart
- Light/dark image switching via `.img-light` / `.img-dark`

A German version of this documentation is available in [README.de.md](README.de.md).

## Installation

```bash
npx quartz plugin add github:boxi-os/quartz-layout-box
```

Create the default snippet at `quartz/static/snippets/snippet.html` in your site, then add the
plugin to `quartz.config.yaml`. The plugin can be added more than once with different options:

```yaml
plugins:
  - source: github:boxi-os/quartz-layout-box
    enabled: true
    options:
      file: snippet.html
    layout:
      position: left
      priority: 15
      display: desktop-only
  - source: github:boxi-os/quartz-layout-box
    enabled: true
    options:
      file: snippet-mobile.html
      className: layout-box-mobile
    layout:
      position: left
      priority: 15
      display: mobile-only
```

## Options

| Option           | Type      | Default                    | Description                                                                    |
| ---------------- | --------- | -------------------------- | ------------------------------------------------------------------------------ |
| `file`           | `string`  | `"snippet.html"`           | Snippet filename inside `dir`. Files ending in `.md` are rendered as Markdown. |
| `dir`            | `string`  | `"quartz/static/snippets"` | Snippet directory, relative to the site root. Files outside it are refused.    |
| `html`           | `string`  | –                          | Inline HTML. Takes precedence over `file`.                                     |
| `className`      | `string`  | –                          | Extra class(es) added next to the fixed `layout-box` class.                    |
| `title`          | `string`  | –                          | Heading (`h3`) rendered above the content. May contain placeholders.           |
| `collapsible`    | `boolean` | `false`                    | Render as `<details>` with `title` as the summary. Requires `title`.           |
| `collapsed`      | `boolean` | `false`                    | Start collapsed (only with `collapsible`).                                     |
| `placeholders`   | `boolean` | `true`                     | Replace `{{...}}` tokens in the snippet.                                       |
| `frontmatterKey` | `string`  | `"layoutBox"`              | Frontmatter key used for per-page control.                                     |
| `byLang`         | `object`  | –                          | Per-language overrides, keyed by language code or locale. See below.           |

Inline HTML example:

```yaml
options:
  title: Note
  collapsible: true
  html: |
    <p>This site is a work in progress.</p>
```

## Placeholders

Placeholders are replaced on every page and HTML-escaped. Unknown placeholders are left as-is.

| Placeholder             | Value                                                                      |
| ----------------------- | -------------------------------------------------------------------------- |
| `{{title}}`             | Page title from frontmatter                                                |
| `{{slug}}`              | Page slug, e.g. `notes/my-page`                                            |
| `{{root}}`              | Relative path to the site root (`.` or `../..`), safe for sub-paths        |
| `{{siteTitle}}`         | `configuration.pageTitle`                                                  |
| `{{baseUrl}}`           | `configuration.baseUrl` (may be empty)                                     |
| `{{locale}}`            | The page's `lang` from frontmatter, falling back to `configuration.locale` |
| `{{lang}}`              | Primary subtag of `{{locale}}`: `en` for `en-US`                           |
| `{{frontmatter.<key>}}` | Any frontmatter value; arrays are joined with `, `, objects are skipped    |

Use `{{root}}` instead of absolute links so the snippet keeps working when the site is served from
a sub-path:

```html
<h2><a href="{{root}}/">{{siteTitle}}</a></h2>
<img class="img-light" src="{{root}}/static/logo-light.png" alt="" />
<img class="img-dark" src="{{root}}/static/logo-dark.png" alt="" />
```

## Per-page control via frontmatter

```yaml
---
layoutBox: false # hide the box on this page
---
```

```yaml
---
layoutBox: about-box.html # use a different snippet (relative to `dir`)
---
```

```yaml
---
layoutBox:
  html: "<p>Inline HTML for this page only</p>"
  # or: file: other.html
  # or: hidden: true
  title: A different heading for this page
  collapsible: true
  collapsed: false
---
```

| Field         | Effect                                       |
| ------------- | -------------------------------------------- |
| `hidden`      | `true` hides the box on this page.           |
| `file`        | Use a different snippet, relative to `dir`.  |
| `html`        | Inline HTML for this page only.              |
| `title`       | Replace the heading on this page.            |
| `collapsible` | Render as `<details>` (or not) on this page. |
| `collapsed`   | Start collapsed (or open) on this page.      |

With two instances, give each its own `frontmatterKey` (for example `layoutBox` and
`layoutBoxMobile`) to control them separately.

## Multiple languages

A site that publishes more than one language from one vault can give each language its own snippet
and heading with `byLang`, without touching the pages themselves:

```yaml
options:
  file: sidebar-note.md
  title: Über dieses Handbuch
  collapsible: true
  byLang:
    en:
      file: sidebar-note.en.md
      title: About this handbook
```

The plugin reads the page's `lang` frontmatter field — the one Quartz renders `<html lang>` from —
and merges the matching `byLang` entry over the base options. It needs no companion plugin: the
field can be written by a multilanguage plugin or by hand. Keys are matched case-insensitively,
first exactly (`en-US`), then by primary subtag (`en`). Pages without `lang` use
`configuration.locale`; a page whose language has no entry gets the base options, without a
warning. `dir` and `frontmatterKey` cannot be overridden per language.

Options are resolved from strongest to weakest:

1. the page's frontmatter (`layoutBox: { title: … }`)
2. `byLang[<page language>]`
3. the base options

## Markdown snippets

If `file` ends in `.md`, the snippet is rendered with standard Markdown (GitHub Flavored Markdown,
inline HTML allowed). It does not go through the Quartz content pipeline, so wikilinks, callouts and
other Obsidian syntax are not supported there.

## Styling

The plugin ships only minimal, colorless styles. The rendered markup is:

```html
<div class="layout-box [className]">
  <h3 class="layout-box-title">…</h3>
  <div class="layout-box-content">…snippet…</div>
</div>
```

or, when `collapsible` is set, a `<details class="layout-box">` with a `<summary class="layout-box-title">`.
Style it from your site's `quartz/styles/custom.scss`, for example:

```scss
.layout-box h2 {
  margin: 0;
}
.layout-box-mobile {
  text-align: center;
}
```

Images with class `img-light` are shown in the light theme, `img-dark` in the dark theme. The plugin
sets `display` on both variants, so do not add a `display` rule for them in `custom.scss`: site CSS
is unlayered and overrides the plugin's layered rules, which would show both images at once.

## Notes

- Snippets are inserted as raw HTML without sanitizing. Only use files you control.
- If a snippet file is missing, the build logs a warning once and renders nothing. In
  `quartz build --serve` a dashed placeholder with the expected path is shown instead.

## Development

```bash
npm install
npm run check   # typecheck + lint + format + tests
npm run build   # writes dist/ (committed, Quartz installs from it)
```

`dist/` is committed on purpose. After changing anything under `src/`, run `npm run build` and
commit the updated `dist/`.

## License

MIT
