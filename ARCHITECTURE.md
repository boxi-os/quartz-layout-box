# Architecture Reference

Machine-readable architecture overview for `quartz-layout-box`, a Quartz v5 component-only plugin.

## Plugin Lifecycle

1. **Loading**: Quartz reads the `quartz` manifest in `package.json` (`category: ["component"]`)
   and imports `./components` (`dist/components/index.js`). The single component is registered
   under its export name `LayoutBox` and under the plugin name `quartz-layout-box`.
2. **Initialization**: For every `quartz.config.yaml` entry with a `layout` block, Quartz calls the
   component constructor with that entry's `options`. Manifest `defaultOptions` are **not** merged on
   this path, so defaults live in `src/components/LayoutBox.tsx`.
3. **Rendering**: The component runs per page at build time (Node), reads the snippet (cached by
   mtime), applies placeholders and returns Preact markup. No client-side script is attached.

## Build System

`tsup` bundles three entry points (`index`, `types`, `components/index`) to `dist/`. Left external
are only the singletons that must resolve to the host's instance: `preact`, `vfile` and
`@jackyzha0/quartz`. Everything else is inlined — including `@quartz-community/utils`, unified,
remark and rehype — because Quartz never installs a pre-built plugin's `dependencies`, it only
symlinks its `peerDependencies`. `noExternal` must stay narrow: tsup evaluates it before `external`,
so a catch-all silently inlines the singletons and gives the plugin its own Preact instance.
`.scss` imports are compiled with `sass` to CSS strings (`Component.css`). `dist/` is committed.

## Directory Structure

- `src/`
  - `components/LayoutBox.tsx`: the component (snippet lookup, cache, frontmatter control, markup).
  - `components/styles/layout-box.scss`: minimal styles, light/dark image switch, missing-file hint.
  - `components/index.ts`: component entry point (`LayoutBox`).
  - `placeholders.ts`: `{{placeholder}}` replacement (pure function).
  - `markdown.ts`: Markdown-to-HTML for `.md` snippets (remark/rehype).
  - `types.ts`: `LayoutBoxOptions` plus re-exported Quartz types.
  - `util/lang.ts`: `classNames` re-export from `@quartz-community/utils`.
  - `build/validate-manifest.ts`: manifest sanity check run from `tsup.config.ts`.
  - `index.ts`: main entry point.
- `test/`: vitest tests (`layout-box.test.ts`, `placeholders.test.ts`).
- `dist/`: build output (committed).
- `package.json`: manifest (`quartz` field) and dependencies.
- `tsup.config.ts`: build configuration.
