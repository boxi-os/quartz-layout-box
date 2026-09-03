# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
