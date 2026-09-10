# quartz-layout-box

Ein Komponenten-Plugin für [Quartz v5](https://quartz.jzhao.xyz), das ein Stück HTML oder Markdown
an eine beliebige Stelle des Seitenlayouts setzt: Seitenspalte, Kopfbereich, Fußzeile, vor oder nach
dem Inhalt. Für eine Wortmarke, ein Logo, einen Aufruf, einen Hinweis — alles, was auf vielen Seiten
gleich aussehen soll, ohne dass man es in ein Theme schreibt.

**📖 Das Handbuch steht auf [boxi-os.github.io/quartz-layout-box](https://boxi-os.github.io/quartz-layout-box/)** —
neun Kapitel auf Deutsch und Englisch, jede Option am Beispiel, ein Kapitel mit Rezepten und die
Gründe für die sperrigen Stellen. Diese README ist die Kurzfassung.

- Schnipsel aus einer Datei (`quartz/static/snippets/`) oder direkt in der `quartz.config.yaml`
- Markdown-Schnipsel (`.md`) werden beim Bauen gerendert
- `{{Platzhalter}}` für Seitentitel, Slug, Site-Titel, Wurzelpfad und Frontmatter-Werte
- Überschrift und aufklappbare `<details>`-Box, ohne JavaScript im Browser
- Steuerung je Seite über das Frontmatter (ausblenden, Schnipsel oder Titel tauschen)
- Optionen je Sprache (`byLang`) für zweisprachige Sites, anhand von `lang` der Seite
- Änderungen am Schnipsel greifen in `quartz build --serve` ohne Neustart
- Bildumschaltung hell/dunkel über `.img-light` / `.img-dark`

## Installation

```bash
npx quartz plugin add github:boxi-os/quartz-layout-box
```

Dann ein Schnipsel unter `quartz/static/snippets/snippet.html` anlegen und das Plugin eintragen:

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

Das Plugin darf mehrfach eingebunden werden, mit eigenen Optionen und eigener Stelle — siehe
[Platzierung](https://boxi-os.github.io/quartz-layout-box/3-platzierung/).

## Optionen

| Option           | Typ     | Standard                 | Beschreibung                                                                                                                                           |
| ---------------- | ------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `file`           | string  | `snippet.html`           | Dateiname des Snippets innerhalb von `dir`. Dateien mit Endung `.md` werden als Markdown gerendert. Wird ignoriert, wenn `html` gesetzt ist.           |
| `dir`            | string  | `quartz/static/snippets` | Ordner für Snippet-Dateien, relativ zur Wurzel der Quartz-Site. Pfade, die aus diesem Ordner hinausführen, werden abgelehnt.                           |
| `html`           | string  | –                        | HTML direkt in der Konfiguration. Hat Vorrang vor `file`. Praktisch für Einzeiler.                                                                     |
| `className`      | string  | –                        | Zusätzliche CSS-Klasse(n) neben der festen Klasse `layout-box`. Damit lassen sich mehrere Instanzen getrennt stylen.                                   |
| `title`          | string  | –                        | Überschrift über dem Inhalt, gerendert als `h3` wie bei anderen Sidebar-Komponenten. Darf Platzhalter enthalten.                                       |
| `collapsible`    | boolean | `false`                  | Box als aufklappbares `details`-Element rendern. `title` wird zur Zeile, auf die man klickt. Ohne `title` wird die Option mit einer Warnung ignoriert. |
| `collapsed`      | boolean | `false`                  | Box beim Laden zugeklappt anzeigen. Nur zusammen mit `collapsible`.                                                                                    |
| `placeholders`   | boolean | `true`                   | Platzhalter der Form `{{name}}` im Snippet ersetzen. Mit `false` bleibt der Text unverändert.                                                          |
| `frontmatterKey` | string  | `layoutBox`              | Name des Frontmatter-Feldes, über das eine einzelne Seite die Box steuern kann (siehe Abschnitt 6).                                                    |
| `byLang`         | object  | –                        | Abweichende Optionen je Sprache, Schlüssel ist der Sprachcode oder die Locale der Seite (siehe Abschnitt 7).                                           |

Beispiel mit Inline-HTML, Titel und Aufklappen:

```yaml
options:
  title: Hinweis
  collapsible: true
  collapsed: true
  html: |
    <p>Diese Site befindet sich im Aufbau.</p>
```

Alles Weitere — Platzhalter, Steuerung je Seite, zwei Sprachen, Gestaltung, Meldungen und Grenzen —
steht im Handbuch:

| Kapitel                                                                         |                                                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------- |
| [1 Einstieg](https://boxi-os.github.io/quartz-layout-box/1-einstieg/)           | Wozu das Plugin, die erste Box, was beim Bauen passiert |
| [2 Der Schnipsel](https://boxi-os.github.io/quartz-layout-box/2-der-schnipsel/) | Datei oder Konfiguration, HTML oder Markdown            |
| [3 Platzierung](https://boxi-os.github.io/quartz-layout-box/3-platzierung/)     | Die sechs Stellen, Reihenfolge, mehrere Instanzen       |
| [4 Platzhalter](https://boxi-os.github.io/quartz-layout-box/4-platzhalter/)     | Jeder Token, und warum Adressen `{{root}}` brauchen     |
| [5 Form](https://boxi-os.github.io/quartz-layout-box/5-form/)                   | Titel, Aufklappen, Gestalten                            |
| [6 Je Seite](https://boxi-os.github.io/quartz-layout-box/6-je-seite/)           | Ausblenden und tauschen über das Frontmatter            |
| [7 Zwei Sprachen](https://boxi-os.github.io/quartz-layout-box/7-zwei-sprachen/) | `byLang`                                                |
| [8 Rezepte](https://boxi-os.github.io/quartz-layout-box/8-rezepte/)             | Fertige Beispiele, alle auf jener Seite zu sehen        |
| [9 Nachschlagen](https://boxi-os.github.io/quartz-layout-box/9-nachschlagen/)   | Alle Optionen, alle Meldungen, die Grenzen              |

Die englische Fassung dieser README steht in [README.md](README.md).

## Entwicklung

```bash
npm install
npm run check   # Typprüfung, Lint, Formatierung, Tests
npm run build   # erzeugt dist/ (wird committed, Quartz installiert daraus)
```

Nach jeder Änderung unter `src/` muss `npm run build` laufen und das aktualisierte `dist/` mit
committed werden. Die CI baut `dist/` neu und schlägt fehl, wenn das Ergebnis vom committeten Stand
abweicht.

Die wichtigsten Dateien: `src/components/LayoutBox.tsx` (Komponente), `src/placeholders.ts`
(Platzhalter), `src/markdown.ts` (Markdown-Rendering), `src/types.ts` (Optionen), `package.json`
(Quartz-Manifest im Feld `quartz`).

## Wie das hier entstanden ist

Ein Hobbyprojekt. Das Plugin ist im Zuge von
[QuartzControl](https://github.com/boxi-os/QuartzControl) entstanden, funktioniert aber in jedem
Quartz-5-Projekt für sich.

Folgendes möchte ich an dieser Stelle transparent machen: Der Code ist zum größten Teil mit
[Claude Code](https://claude.com/claude-code) entstanden; die Commits sagen das mit einem
`Co-Authored-By`-Eintrag. Mir ist bewusst, dass Vibe-coding teilweise kontrovers diskutiert wird,
und ich möchte hier nichts verbergen.

## Wie gut ist der Code geprüft?

`npm run check` fährt Typcheck, Linter, Formatprüfung, 30 Tests und den Bau; die CI tut bei
jedem Push dasselbe. Das ist keine Garantie, aber es ist etwas, das ihr selbst laufen lassen könnt,
bevor ihr dem Plugin vertraut.

---

quartz-layout-box · <https://github.com/boxi-os/quartz-layout-box> · Lizenz MIT
