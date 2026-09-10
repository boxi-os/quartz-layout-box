# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `byLang` option: per-language overrides (`title`, `file`, `html`, `collapsible`, …) keyed by
  language code or locale, chosen by the page's `lang` frontmatter field (fallback:
  `configuration.locale`). Matching is case-insensitive, exact locale first, then the primary
  subtag. `dir` and `frontmatterKey` are not overridable per language.
- Per-page frontmatter control now also accepts `title`, `collapsible` and `collapsed`.
- `title` goes through placeholder replacement like the snippet content (when `placeholders` is on).
- `{{lang}}` placeholder: the primary subtag of the page's locale (`en` for `en-US`).

### Fixed

- The `dir` boundary let a **symlink** through. `resolveSnippetPath` compared the lexically resolved
  path (`path.resolve` + `path.relative`), which says nothing about what a link inside `dir` points
  at: a `snippets/link.html -> ../../../etc/passwd` was read without a word. Both sides now go
  through `realpathSync` before they are compared — both, so that a `dir` that is itself a link (a
  snippet folder linked into the site) keeps working. A file that does not exist is still reported
  as missing rather than refused.
- Placeholders in the target of a **Markdown link** were not replaced. `[x]({{root}}/y)` in a `.md`
  snippet is turned into an `href` by the Markdown renderer, which percent-encodes the braces along
  the way; the replacement then looked for `{{root}}`, found nothing, and the link shipped with
  `%7B%7Broot%7D%7D` in it. Found on 2026-09-10 while publishing four sites at once, where every
  such link pointed nowhere under the path prefix of GitHub Pages. The encoded form is now
  recognised as well, including `%20` where the writer left a space inside the braces. Text that
  merely looks encoded (`%7B%7Bnot a name%7D%7D`) is left alone.
- The build inlined its own copy of Preact and vfile: `noExternal: [/.*/]` in `tsup.config.ts` is
  evaluated before `external` and silently disabled the singleton list. The plugin therefore ran on
  a second Preact instance with its own `options` hooks. Only VNode creation was affected so far,
  but hooks and context would have broken. `preact`, `vfile` and `@jackyzha0/quartz` are now
  genuinely external; everything else stays bundled, since Quartz installs no `dependencies` for a
  pre-built plugin.

### Changed

- `{{locale}}` now resolves to the page's `lang` frontmatter field when present and only falls back
  to `configuration.locale`. On a site that sets `lang` per page the placeholder therefore renders
  a different value than before; single-language sites are unaffected.
- The light/dark image switch now sets `display` on `.img-light` as well, so the plugin fully owns
  the visibility of both variants. A site no longer needs its own rule — and must not add one, since
  site CSS is unlayered and would override the plugin's layered rules.
- The German documentation moved from a generated `docs/` HTML file and PDF to `README.de.md`, so it
  is diffable and gets updated alongside the English README.
- Changesets and the npm release workflow were removed. The plugin is installed via `github:` and was
  never published to npm; Changesets only bumped `version`, which then silently drifted apart from
  `quartz.version`. `validateManifest()` now fails the build if the two differ.
- `vfile` is no longer declared an optional peer dependency. It is left external and the bundled
  unified pipeline imports it at runtime, so it has to be present; `peerDependenciesMeta` was
  removed and both peers are required.

## [0.2.0] - 2026-09-03

### Breaking

- Option `datei` renamed to `file`.
- Plugin category is now `["component"]`. The template's example transformer, filter and emitter
  were removed; they previously ran on every page as a side effect of the `transformer` category.
- Component export renamed from `ExampleComponent` to `LayoutBox`.

### Added

- `dir` option for a custom snippet directory (relative to the site root).
- `html` option for inline snippets in `quartz.config.yaml`.
- `title`, `collapsible` and `collapsed` options.
- `{{placeholders}}` (`title`, `slug`, `root`, `siteTitle`, `baseUrl`, `locale`, `frontmatter.*`).
- Per-page control via frontmatter (`frontmatterKey`, default `layoutBox`).
- Markdown snippets (`.md`) rendered at build time.
- Light/dark image switching styles for `.img-light` / `.img-dark`.
- Snippet files are re-read when they change (works in `quartz build --serve`).
- Visible placeholder for missing snippet files in serve mode.

### Removed

- Template client-side script (global keyboard shortcut, console logging) and gradient styling.

## [0.1.0]

- Initial fork of the Quartz community plugin template with a snippet-based layout box.
