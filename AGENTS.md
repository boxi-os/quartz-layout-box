# quartz-layout-box

Provider-agnostic instruction file for AI coding assistants working on this repository.

## Project Overview

`quartz-layout-box` is a Quartz v5 **component-only** plugin. It renders an HTML or Markdown
snippet (from `quartz/static/snippets/` or inline YAML) as a layout component. It started from
`quartz-community/plugin-template`; the template's example transformer/filter/emitter were removed.
See `ARCHITECTURE.md` for the lifecycle and file map, `README.md` for user-facing options.

## Files to Modify

- `src/components/LayoutBox.tsx`: component logic.
- `src/placeholders.ts`, `src/markdown.ts`: helpers.
- `src/types.ts`: `LayoutBoxOptions` (single source of truth for options).
- `package.json` → `quartz` manifest: keep `defaultOptions` and the `components` map in sync with
  the code. The manifest must declare exactly one component so Quartz can resolve it by plugin name.
- `test/`: vitest tests.

## Leave Alone

- `dist/`: build output. **Tracked and committed** (Quartz installs from it). Rebuild with
  `npm run build` after any change under `src/` and commit the result.
- `.github/`, `.changeset/`: CI and release configuration.
- `tsup.config.ts`: only touch to add native-dependency exclusions.

## Workflow

1. Change code under `src/` and add/adjust tests in `test/`.
2. `npm run check` (typecheck, lint, prettier, vitest) must pass.
3. `npm run build`, commit `dist/` together with the source change. CI rebuilds `dist/` and
   fails if the result differs from the committed one, and checks every emitted `.js` file
   for unbundled external imports.
4. Update `README.md` (options table) and `CHANGELOG.md`.

## Constraints

- Quartz calls the component constructor with the raw YAML `options`; manifest `defaultOptions`
  are not merged in. Keep defaults in `LayoutBox.tsx`.
- Import `@quartz-community/utils` via subpaths (`/lang`, `/escape`); the root index pulls in
  packages that are not installed here.
- No client-side script is needed; if one is ever added, follow Quartz's `nav`/`addCleanup` rules
  and the `.inline.ts` loader in `tsup.config.ts`.
- `preact` and `vfile` stay peerDependencies; everything else is bundled.
