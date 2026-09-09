# quartz-layout-box

Deutsche Dokumentation · Version 0.2.0 · Quartz 5 Community-Plugin
([English README](README.md))

- [1. Was das Plugin macht](#1-was-das-plugin-macht)
- [2. Funktionsweise](#2-funktionsweise)
- [3. Installation und Einbindung](#3-installation-und-einbindung)
- [4. Optionen](#4-optionen)
- [5. Platzhalter](#5-platzhalter)
- [6. Steuerung per Frontmatter](#6-steuerung-per-frontmatter)
- [7. Mehrere Sprachen](#7-mehrere-sprachen)
- [8. Markdown-Snippets](#8-markdown-snippets)
- [9. Titel und aufklappbare Box](#9-titel-und-aufklappbare-box)
- [10. Markup und Styling](#10-markup-und-styling)
- [11. Verhalten bei Fehlern](#11-verhalten-bei-fehlern)
- [12. Mehrere Instanzen](#12-mehrere-instanzen)
- [13. Umstieg von Version 0.1](#13-umstieg-von-version-01)
- [14. Entwicklung](#14-entwicklung)

## 1. Was das Plugin macht

Die Layout-Box fügt an einer beliebigen Stelle des Quartz-Layouts ein Stück HTML ein: in der linken
oder rechten Seitenleiste, im Header, im Footer oder vor beziehungsweise nach dem Seiteninhalt.
Typische Einsatzfälle sind ein Titelblock mit Logo, ein Untertitel, ein Hinweiskasten, ein Spenden-
oder Newsletter-Link oder eine kurze Beschreibung der Site.

Der Inhalt kommt aus einer Snippet-Datei im Ordner `quartz/static/snippets/` der Site oder direkt aus
der `quartz.config.yaml`. Snippets können HTML oder Markdown sein. Beim Rendern werden Platzhalter
wie `{{siteTitle}}` ersetzt. Das Plugin arbeitet vollständig zur Build-Zeit und liefert kein
JavaScript an den Browser aus.

## 2. Funktionsweise

Quartz lädt das Plugin als reine Komponente. Für jeden Eintrag in der `quartz.config.yaml`, der einen
`layout`-Block besitzt, wird eine eigene Instanz mit den dort angegebenen Optionen erzeugt. Beim Bau
jeder Seite läuft dann folgender Ablauf:

1. **Frontmatter prüfen** — Ist die Box für diese Seite ausgeblendet oder wurde ein anderes Snippet
   gewählt? Hat die Seite eine Sprache, für die `byLang` eigene Optionen kennt?
2. **Quelle bestimmen** — Inline-HTML aus der Konfiguration hat Vorrang, sonst die Datei
   `dir`/`file`.
3. **Datei lesen** — Der Pfad muss innerhalb von `dir` liegen. Gelesen wird mit Cache: nur wenn sich
   die Änderungszeit der Datei geändert hat, wird sie neu geladen.
4. **Markdown rendern** — Endet die Datei auf `.md`, wird sie zu HTML umgewandelt. Das Ergebnis
   landet ebenfalls im Cache.
5. **Platzhalter ersetzen** — Seiten- und Site-Werte werden eingesetzt, HTML-Sonderzeichen dabei
   maskiert.
6. **Markup ausgeben** — Ein `div` mit Klasse `layout-box`, optional mit Überschrift oder als
   aufklappbares `details`-Element.

Weil die Datei bei jedem Render gegen ihre Änderungszeit geprüft wird, greifen Änderungen am Snippet
im Modus `npx quartz build --serve` sofort, ohne Neustart. Im normalen Build kostet das pro Seite nur
einen Dateisystem-Stat.

## 3. Installation und Einbindung

```bash
npx quartz plugin add github:boxi-os/quartz-layout-box
```

Danach ein Snippet anlegen, zum Beispiel `quartz/static/snippets/snippet.html`, und das Plugin in der
`quartz.config.yaml` eintragen. Der `layout`-Block bestimmt, wo die Box erscheint:

```yaml
plugins:
  - source: github:boxi-os/quartz-layout-box
    enabled: true
    options:
      file: snippet.html
    layout:
      position: left # left | right | header | footer | beforeBody | afterBody
      priority: 15 # Reihenfolge innerhalb der Position, kleiner = weiter oben
      display: desktop-only # all | desktop-only | mobile-only
```

Ohne `options` gelten die Standardwerte: Datei `snippet.html` im Ordner `quartz/static/snippets`.

## 4. Optionen

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

## 5. Platzhalter

Platzhalter werden auf jeder Seite neu ersetzt, die Werte werden HTML-maskiert. Unbekannte
Platzhalter bleiben unverändert stehen. Leerzeichen innerhalb der Klammern sind erlaubt.

| Platzhalter              | Wert                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `{{title}}`              | Titel der aktuellen Seite aus dem Frontmatter                                                                                     |
| `{{slug}}`               | Slug der aktuellen Seite, zum Beispiel `notizen/meine-seite`                                                                      |
| `{{root}}`               | Relativer Pfad zur Wurzel der Site (`.` auf der Startseite, `../..` zwei Ebenen tiefer). Funktioniert auch unter einem Unterpfad. |
| `{{siteTitle}}`          | `configuration.pageTitle` aus der Quartz-Konfiguration                                                                            |
| `{{baseUrl}}`            | `configuration.baseUrl`, kann leer sein                                                                                           |
| `{{locale}}`             | Sprache der Seite aus dem Frontmatter-Feld `lang`, sonst `configuration.locale`, zum Beispiel `de-DE`                             |
| `{{lang}}`               | Nur der Hauptteil von `{{locale}}`: `en` bei `en-US`                                                                              |
| `{{frontmatter.<feld>}}` | Beliebiges Frontmatter-Feld der Seite. Listen werden mit Komma verbunden, Objekte werden nicht ersetzt.                           |

Empfehlung: Links und Bildpfade im Snippet mit `{{root}}` statt mit absolutem `/` schreiben.

```html
<h2><a href="{{root}}/">{{siteTitle}}</a></h2>
<p>Politische Notizen aus der Provinz</p>
<img class="img-light" src="{{root}}/static/logo-light.png" alt="" />
<img class="img-dark" src="{{root}}/static/logo-dark.png" alt="" />
```

## 6. Steuerung per Frontmatter

Einzelne Seiten können die Box über ein Frontmatter-Feld beeinflussen. Der Feldname ist über
`frontmatterKey` einstellbar, Standard ist `layoutBox`.

| Frontmatter                         | Wirkung                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `layoutBox: false`                  | Box auf dieser Seite ausblenden.                                                                              |
| `layoutBox: impressum.html`         | Anderes Snippet verwenden, relativ zu `dir`.                                                                  |
| `layoutBox:` mit `html: "<p>…</p>"` | Inline-HTML nur für diese Seite. Alternativ `file:` für eine andere Datei oder `hidden: true` zum Ausblenden. |
| `layoutBox:` mit `title: …`         | Andere Überschrift nur für diese Seite. Ebenso `collapsible:` und `collapsed:`.                               |

```yaml
---
layoutBox:
  html: "<p>Nur hier</p>"
  title: Nur hier so überschrieben
---
```

Bei mehreren Instanzen bekommt jede ihren eigenen `frontmatterKey`, zum Beispiel `layoutBox` und
`layoutBoxMobile`, damit sie unabhängig voneinander gesteuert werden können.

## 7. Mehrere Sprachen

Veröffentlicht eine Site mehrere Sprachen aus einem Vault, kann jede Sprache mit `byLang` ihr
eigenes Snippet und ihre eigene Überschrift bekommen, ohne dass die Seiten selbst etwas dafür tun
müssen:

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

Gelesen wird das Frontmatter-Feld `lang` der Seite — das Feld, aus dem Quartz selbst
`<html lang>` erzeugt. Das Plugin braucht dafür kein weiteres Plugin; das Feld kann von einem
Mehrsprachen-Plugin oder von Hand geschrieben sein. Der passende `byLang`-Eintrag wird über die
Grundoptionen gelegt. Schlüssel werden ohne Rücksicht auf Groß-/Kleinschreibung verglichen, erst
exakt (`en-US`), dann über den Hauptteil (`en`). Seiten ohne `lang` verwenden
`configuration.locale`; findet sich für eine Sprache kein Eintrag, gelten die Grundoptionen ohne
Warnung. `dir` und `frontmatterKey` lassen sich nicht je Sprache ändern.

Die Optionen gelten von stark nach schwach:

1. Frontmatter der Seite (`layoutBox: { title: … }`)
2. `byLang[<Sprache der Seite>]`
3. Grundoptionen

## 8. Markdown-Snippets

Endet `file` auf `.md`, wird die Datei beim Build mit Standard-Markdown gerendert (GitHub Flavored
Markdown, eingebettetes HTML erlaubt). Platzhalter funktionieren auch hier.

```markdown
## {{siteTitle}}

Politische Notizen aus der _Provinz_.

- [Über diese Site]({{root}}/ueber)
- [Kontakt]({{root}}/kontakt)
```

Markdown-Snippets laufen nicht durch die Quartz-Inhaltspipeline. Wikilinks in doppelten eckigen
Klammern, Callouts und andere Obsidian-Syntax werden dort nicht aufgelöst. Normale Markdown-Links
funktionieren.

## 9. Titel und aufklappbare Box

Mit `title` erhält die Box eine Überschrift. Mit `collapsible: true` wird sie zu einem aufklappbaren
Element, bei dem der Titel als Klickzeile dient. `collapsed: true` startet zugeklappt. Das
funktioniert ohne JavaScript über das HTML-Element `details`; der Browser merkt sich den Zustand
nicht über Seitenwechsel hinweg.

## 10. Markup und Styling

Das Plugin bringt nur minimale, farblose Regeln mit. Das erzeugte Markup:

```html
<div class="layout-box [className]">
  <h3 class="layout-box-title">…</h3>
  <!-- nur mit title -->
  <div class="layout-box-content">…Snippet…</div>
</div>

<!-- mit collapsible: -->
<details class="layout-box [className]" open>
  <summary class="layout-box-title">…</summary>
  <div class="layout-box-content">…Snippet…</div>
</details>
```

Gestaltet wird in der `quartz/styles/custom.scss` der Site. Beispiel:

```scss
.layout-box h2 {
  margin: 0;
  font-size: 1.9rem;
}
.layout-box p {
  font-style: italic;
  color: var(--dark);
}
.layout-box-mobile {
  text-align: center;
}
```

Mitgelieferte Regeln: Bilder werden auf die Breite der Box begrenzt. Bilder mit Klasse `img-light`
erscheinen nur im hellen, Bilder mit `img-dark` nur im dunklen Theme; das Plugin setzt dabei
`display` für beide Varianten. Deshalb in der `custom.scss` **keine** eigene `display`-Regel für
diese Bilder setzen: Site-CSS ist ungelayert und schlägt die gelayerten Plugin-Regeln, wodurch beide
Bilder gleichzeitig sichtbar würden. Eine fehlende Snippet-Datei
wird im Serve-Modus als gestrichelter Kasten dargestellt (Klasse `layout-box-missing`).

## 11. Verhalten bei Fehlern

| Situation                                            | Verhalten                                                                                                                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Snippet-Datei fehlt                                  | Einmalige Warnung in der Konsole mit vollständigem Pfad. Im normalen Build wird nichts ausgegeben. Bei `quartz build --serve` erscheint ein gestrichelter Kasten mit dem erwarteten Pfad. |
| Pfad führt aus `dir` hinaus (z. B. `../secret.html`) | Wird abgelehnt, Warnung, keine Ausgabe.                                                                                                                                                   |
| Snippet ist leer                                     | Keine Ausgabe, auch kein leeres `div`.                                                                                                                                                    |
| `collapsible` ohne `title`                           | Warnung, Box wird normal ohne Aufklappen gerendert.                                                                                                                                       |

Snippets werden ungefiltert als HTML eingefügt. Nur Dateien verwenden, die man selbst kontrolliert.

## 12. Mehrere Instanzen

Das Plugin kann mehrfach eingebunden werden, etwa mit unterschiedlichen Snippets für Desktop und
Mobil. Jede Instanz bekommt eigene Optionen und einen eigenen `layout`-Block:

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
      frontmatterKey: layoutBoxMobile
    layout:
      position: left
      priority: 15
      display: mobile-only
```

## 13. Umstieg von Version 0.1

- Die Option `datei` heißt jetzt `file`. Bestehende `quartz.config.yaml`-Einträge entsprechend
  anpassen.
- Das Plugin ist jetzt als reine Komponente deklariert. Der Beispiel-Transformer der Vorlage, der
  vorher ungewollt auf allen Seiten lief, ist entfernt.
- Die Regeln für `img-light` und `img-dark` liefert das Plugin jetzt selbst mit. Eigene Regeln dazu
  in der `custom.scss` können entfallen.
- Nach dem Aktualisieren des Plugins in der Site neu installieren, damit Quartz das geänderte
  Manifest liest.

## 14. Entwicklung

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

## 15. Wie das hier entstanden ist

Ein Hobbyprojekt. Das Plugin ist im Zuge von
[QuartzControl](https://github.com/boxi-os/QuartzControl) entstanden, funktioniert aber in jedem
Quartz-5-Projekt für sich.

Folgendes möchte ich an dieser Stelle transparent machen: Der Code ist zum größten Teil mit
[Claude Code](https://claude.com/claude-code) entstanden; die Commits sagen das mit einem
`Co-Authored-By`-Eintrag. Mir ist bewusst, dass Vibe-coding teilweise kontrovers diskutiert wird,
und ich möchte hier nichts verbergen.

## 16. Wie gut ist der Code geprüft?

`npm run check` fährt Typcheck, Linter, Formatprüfung, 28 Tests und den Bau; die CI tut bei
jedem Push dasselbe. Das ist keine Garantie, aber es ist etwas, das ihr selbst laufen lassen könnt,
bevor ihr dem Plugin vertraut.

---

quartz-layout-box · <https://github.com/boxi-os/quartz-layout-box> · Lizenz MIT
