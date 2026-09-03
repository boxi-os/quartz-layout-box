# quartz-layout-box

A [Quartz v5](https://quartz.jzhao.xyz) component plugin that renders an HTML or Markdown snippet
anywhere in the page layout: sidebar, header, footer, before or after the body. Use it for a site
title block, a logo, a call-to-action, a notice, or any small piece of static markup you don't want
to hard-code into a theme.

- Snippet from a file (`quartz/static/snippets/` by default) or inline in `quartz.config.yaml`
- Markdown snippets (`.md`) are rendered at build time
- `{{placeholders}}` for page title, slug, site title, root path and frontmatter values
- Optional heading and collapsible `<details>` box, no client-side JavaScript
- Per-page control via frontmatter (hide the box or switch the snippet)
- Snippet changes are picked up in `quartz build --serve` without a restart
- Light/dark image switching via `.img-light` / `.img-dark`

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
| `title`          | `string`  | –                          | Heading (`h3`) rendered above the content.                                     |
| `collapsible`    | `boolean` | `false`                    | Render as `<details>` with `title` as the summary. Requires `title`.           |
| `collapsed`      | `boolean` | `false`                    | Start collapsed (only with `collapsible`).                                     |
| `placeholders`   | `boolean` | `true`                     | Replace `{{...}}` tokens in the snippet.                                       |
| `frontmatterKey` | `string`  | `"layoutBox"`              | Frontmatter key used for per-page control.                                     |

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

| Placeholder             | Value                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| `{{title}}`             | Page title from frontmatter                                             |
| `{{slug}}`              | Page slug, e.g. `notes/my-page`                                         |
| `{{root}}`              | Relative path to the site root (`.` or `../..`), safe for sub-paths     |
| `{{siteTitle}}`         | `configuration.pageTitle`                                               |
| `{{baseUrl}}`           | `configuration.baseUrl` (may be empty)                                  |
| `{{locale}}`            | `configuration.locale`                                                  |
| `{{frontmatter.<key>}}` | Any frontmatter value; arrays are joined with `, `, objects are skipped |

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
---
```

With two instances, give each its own `frontmatterKey` (for example `layoutBox` and
`layoutBoxMobile`) to control them separately.

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

Images with class `img-light` are shown in the light theme, `img-dark` in the dark theme.

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
