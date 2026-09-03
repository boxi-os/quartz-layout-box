# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`quartz-layout-box` is a [Quartz](https://quartz.jzhao.xyz) v5 **component-only** community plugin,
forked from `quartz-community/plugin-template`. It renders an HTML or Markdown snippet (file under
`quartz/static/snippets/` in the host site, or inline YAML) as a layout component, with
`{{placeholders}}`, optional title/collapsible box, per-page frontmatter control and an mtime cache.
The template's example transformer/filter/emitter and inline script have been removed.

`AGENTS.md` (workflow and constraints) and `ARCHITECTURE.md` (lifecycle, file map) are the detailed
references. `dist/` is **tracked and committed** in this repo, Quartz installs from it.

## Commands

```bash
npm install         # install deps
npm run build        # tsup build -> dist/ (must be committed after changes to src/)
npm run dev           # tsup --watch
npm run typecheck    # tsc --noEmit
npm run lint          # eslint . --max-warnings=0
npm run format        # prettier . --check (use `prettier . --write` to fix)
npm test              # vitest run
npm run check          # typecheck + lint + format + test (run before submitting)
```

Run a single test file: `npx vitest run test/layout-box.test.ts`
Run tests matching a name: `npx vitest run -t "placeholders"`

## Architecture

- `src/components/LayoutBox.tsx` — the component. Resolves `file` inside `dir` (refuses paths that
  escape it), reads the snippet with an mtime cache, renders `.md` via `src/markdown.ts`, applies
  `src/placeholders.ts`, honours frontmatter control (`frontmatterKey`), and returns the markup
  (`div`/`details` with `.layout-box`, `.layout-box-title`, `.layout-box-content`). Missing files
  render `null`, or a dashed hint when `ctx.argv.serve` is true.
- `src/types.ts` — `LayoutBoxOptions` (single definition) plus re-exported Quartz types.
- `src/components/styles/layout-box.scss` — minimal styles, `.img-light`/`.img-dark` switch.
- `src/index.ts`, `src/components/index.ts` — entry points; Quartz loads `./components` and looks up
  the export named in the `package.json` `quartz.components` map (`LayoutBox`).
- `src/build/validate-manifest.ts` — runs from `tsup.config.ts`, warns on missing manifest keys.
- `test/` — vitest; `layout-box.test.ts` uses a temp directory as `dir` and inspects the returned
  Preact vnode (no render-to-string dependency).

### How Quartz wires the component (verified against Quartz v5 `config-loader.ts`)

- `category: ["component"]` → Quartz imports `./components` and registers the single component under
  `LayoutBox` and the plugin name `quartz-layout-box`. Declaring more than one component would break
  lookup by plugin name.
- Each YAML entry with a `layout` block instantiates the constructor with that entry's `options`
  (cache key = JSON of options). Manifest `defaultOptions` are **not** merged in → keep defaults in code.
- Component-only plugins receive no `init()` call unless exported; none is needed here.

### Build system (`tsup.config.ts`)

- Entry points `index`, `types`, `components/index`; everything bundled except `preact`,
  `@jackyzha0/quartz`, `vfile` (singleton externals). `.scss` compiled via `sass` to a CSS string.
- Import `@quartz-community/utils` via subpaths (`/lang`, `/escape`); the root index requires
  packages that are not installed here.
- Because `dist/` is committed and not gitignored, Quartz treats the plugin as pre-built: it skips
  `npm install` for it entirely and only symlinks the declared `peerDependencies` into the installed
  plugin directory (`hasPrebuiltDist()` / `linkPeerDependencies()` in
  `quartz/plugins/loader/gitLoader.ts`). `dependencies` are never installed there, so everything
  except the peers must be bundled. The install-build-prune path applies only to plugins that ship
  without a `dist/`.

## Claude-Skills in diesem Projekt

Skills werden projektlokal unter `.claude/skills/` bereitgestellt, nie global. Skills, die nicht
projektspezifisch sind, liegen im gemeinsamen Store `~/.agents/skills/` und werden hierher verlinkt;
die Symlinks sind in `.gitignore` ausgenommen, weil sie absolute Pfade enthalten:

    ln -s ~/.agents/skills/firecrawl-scrape .claude/skills/firecrawl-scrape
    ln -s ~/.agents/skills/projekt-dokumentieren .claude/skills/projekt-dokumentieren

Verfügbare Skills im Store: `ls ~/.agents/skills/`
