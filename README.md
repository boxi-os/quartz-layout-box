# quartz-layout-box

A [Quartz v5](https://quartz.jzhao.xyz) component plugin that renders an HTML or Markdown snippet
anywhere in the page layout: sidebar, header, footer, before or after the body. Use it for a site
title block, a logo, a call-to-action, a notice, or any small piece of static markup you don't want
to hard-code into a theme.

**📖 The handbook is at [boxi-os.github.io/quartz-layout-box](https://boxi-os.github.io/quartz-layout-box/)** —
nine chapters in English and German, with every option explained by example, a chapter of recipes,
and the reasons behind the awkward parts. This README is the short version.

- Snippet from a file (`quartz/static/snippets/` by default) or inline in `quartz.config.yaml`
- Markdown snippets (`.md`) are rendered at build time
- `{{placeholders}}` for page title, slug, site title, root path and frontmatter values
- Optional heading and collapsible `<details>` box, no client-side JavaScript
- Per-page control via frontmatter (hide the box, switch the snippet or the title)
- Per-language options (`byLang`) for bilingual sites, keyed on the page's `lang`
- Snippet changes are picked up in `quartz build --serve` without a restart
- Light/dark image switching via `.img-light` / `.img-dark`

## Installation

```bash
npx quartz plugin add github:boxi-os/quartz-layout-box
```

Create the default snippet at `quartz/static/snippets/snippet.html` in your site, then add the
plugin to `quartz.config.yaml`:

```yaml
plugins:
  - source: github:boxi-os/quartz-layout-box
    enabled: true
    options:
      file: snippet.html
    layout:
      position: left
      priority: 15
```

The plugin can be added more than once, with different options and different places — see
[Placement](https://boxi-os.github.io/quartz-layout-box/en/3-placement/).

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

Everything else — placeholders, per-page control, two languages, styling, error messages and the
limits — is in the handbook:

| Chapter                                                                                |                                                                    |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| [1 Getting started](https://boxi-os.github.io/quartz-layout-box/en/1-getting-started/) | What the plugin is for, your first box, what happens at build time |
| [2 The snippet](https://boxi-os.github.io/quartz-layout-box/en/2-the-snippet/)         | File or configuration, HTML or Markdown                            |
| [3 Placement](https://boxi-os.github.io/quartz-layout-box/en/3-placement/)             | The six places, order, several instances                           |
| [4 Placeholders](https://boxi-os.github.io/quartz-layout-box/en/4-placeholders/)       | Every token, and why addresses want `{{root}}`                     |
| [5 Form](https://boxi-os.github.io/quartz-layout-box/en/5-form/)                       | Heading, collapsing, styling                                       |
| [6 Per page](https://boxi-os.github.io/quartz-layout-box/en/6-per-page/)               | Hiding and swapping through frontmatter                            |
| [7 Two languages](https://boxi-os.github.io/quartz-layout-box/en/7-two-languages/)     | `byLang`                                                           |
| [8 Recipes](https://boxi-os.github.io/quartz-layout-box/en/8-recipes/)                 | Finished examples, all of them visible on that site                |
| [9 Reference](https://boxi-os.github.io/quartz-layout-box/en/9-reference/)             | Every option, every message, the limits                            |

A German version of this README is in [README.de.md](README.de.md); the handbook is bilingual too.

## Development

```bash
npm install
npm run check   # typecheck + lint + format + tests
npm run build   # writes dist/ (committed, Quartz installs from it)
```

`dist/` is committed on purpose. After changing anything under `src/`, run `npm run build` and
commit the updated `dist/`.

## How this was built

A hobby project. The plugin came out of work on
[QuartzControl](https://github.com/boxi-os/QuartzControl), but it stands on its own in any Quartz 5
project.

One thing I want to be open about: the code was written mostly with
[Claude Code](https://claude.com/claude-code); the commits say so with a `Co-Authored-By` line. I
am aware that vibe coding is a contested subject, and I do not want to hide anything here.

## How well is the code checked?

`npm run check` runs the typecheck, the linter, the formatter, 30 tests and the build; CI does
the same on every push. That is not a guarantee, but it is something you can run yourself before you
trust the plugin.

## License

MIT
