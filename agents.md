# AGENTS.md

## Zweck
Dieses Dokument ist die operative Referenz für Agenten, die an EduTimer arbeiten.
Source of truth ist der laufende Code, primär `script/script.js`, `index.html`, `sw.js`, `manifest.json`.

## Projektprofil
- EduTimer ist eine rein clientseitige PWA zur Zeiterfassung für Lehrpersonen.
- Kein Backend, keine Authentifizierung, keine Cloud-Synchronisation.
- Datenhaltung vollständig lokal im Browser (IndexedDB).
- Offline-Nutzung über Service Worker Cache.
- UI basiert auf statischem HTML + Bootstrap 5 + Bootstrap Icons (CDN).

## Laufzeitarchitektur
- Einstieg über `index.html`.
- Gesamte Logik in `script/script.js`.
- Styles primär Bootstrap, ergänzt durch `css/style.css`.
- PWA-Metadaten in `manifest.json`.
- Offline-Cache in `sw.js`.

## IndexedDB-Vertrag
- DB-Name: `TimeTrackerDB`
- DB-Version: `2`
- Stores:
- `config` (keyPath `id`)
- `entries` (keyPath `id`, autoIncrement, Index `by_date` auf `date`)
- `categories` (keyPath `id`, autoIncrement)

### Datenschema `config`
- `id: number` (immer `1`)
- `yearHours: number`
- `employment: number` (Prozent 0..100)
- `age: number`
- `start: string` (`YYYY-MM-DD`)
- `end: string` (`YYYY-MM-DD`)

### Datenschema `entries`
- `id: number`
- `date: string` (`YYYY-MM-DD`)
- `minutes: number`
- `category: string` (Kategoriecode)
- `note: string`

### Datenschema `categories`
- `id: number`
- `code: string`
- `name: string`

## Kategorienlogik
- Default-Codes: `A`, `B`, `C`, `D`, `E`, `EA`.
- Default-Kategorien werden bei leerem Category-Store automatisch erzeugt.
- Default-Kategorien sind in der Config-Liste nicht löschbar.
- Custom-Kategorien sind löschbar.
- Kategoriecodes müssen eindeutig sein.

## Kern-Userflows
- Navigation über vier Views: `day`, `overview`, `config`, `help`.
- Tagesansicht:
- Datum vor/zurück oder Datepicker.
- Einträge des Tages laden (Index `by_date`, Fallback Cursor-Scan).
- Tages-, Wochen- und Monatssumme werden berechnet.
- Eintrag-Modal:
- Neu oder Edit im selben Modal.
- Speichern nur bei gültigem Formular und `minutes > 0`.
- Löschen mit Confirm.
- Konfiguration:
- Speichert Jahresstunden, Anstellungsgrad, Alter, Zeitraum.
- Validierung: Startdatum muss vor Enddatum liegen.
- Übersicht:
- SOLL/IST für Gruppen:
- `A+B` Soll 87.4%
- `C+D+E` Soll 12.6%
- IST je Kategorie inkl. `EA` + Custom.
- Import/Export:
- Export als CSV mit Timestamp im Dateinamen.
- Import liest CSV-Zeilen und fügt Einträge hinzu.
- Wartung:
- `Alle Einträge löschen` leert nur `entries`.
- `Datenbank zurücksetzen` löscht gesamte IndexedDB.

## Berechnungslogik
- Sollstunden basieren auf:
- `yearHours * (employment/100) * (periodDays/365)`
- Ferienabzug:
- Altersstaffel: `<50 => 25`, `<60 => 27`, `>=60 => 30` Tage/Jahr
- Stundenabzug: `vacDaysForPeriod * 8.4 * (employment/100)`
- Gruppensummen:
- `A+B` und `C+D+E` werden getrennt aggregiert.
- IST-% in Gruppenansicht beziehen sich auf `A..E` Gesamtzeit.
- IST-% in Kategorienansicht beziehen sich auf Gesamtzeit aller Einträge im Zeitraum.

## CSV-Schnittstelle
- Header exakt:
- `"id";"date";"minutes";"category";"note"`
- Separator: `;`
- Quotes: doppelte Anführungszeichen, Escaping per `""`.
- Beim Import wird `id` ignoriert, da `entries.id` autoIncrement nutzt.

## PWA- und Cache-Vertrag
- Manifest:
- `start_url: /edutimer/index.html`
- `scope: /edutimer/`
- Service Worker:
- Cache-Name: `edutimer-cache-v1`
- Precache-Assets unter `/edutimer/...`
- Fetch-Strategie: Cache-first, sonst Network, same-origin Responses werden nachgecacht.

## Agenten-Arbeitsregeln
- Code ist maßgeblich, README/CLAUDE nur ergänzend.
- Bei Änderungen an DB-Struktur:
- `openDB()` Migration sauber erweitern.
- Datenschema in diesem Dokument mitziehen.
- Bei Änderungen an UI-IDs:
- Alle Event-Bindings in `script.js` mitprüfen.
- Bei Änderungen an Kategorien/Statistik:
- Gruppierungslogik (`A+B`, `C+D+E`) konsistent halten.
- Bei Änderungen an Deployment-Pfaden:
- `manifest.json` und `sw.js` synchron aktualisieren.
- Keine Framework-Einführung ohne expliziten Produktentscheid.

## Definition of Done für Agenten
- Manuelle Smoke-Checks:
- Konfiguration speichern (inkl. Datumsvalidierung).
- Eintrag anlegen, bearbeiten, löschen.
- Tages-/Wochen-/Monatstotal plausibel.
- Übersicht zeigt SOLL/IST und Kategorien korrekt.
- CSV Export funktioniert.
- CSV Import funktioniert und aktualisiert Anzeige.
- `Alle Einträge löschen` und `Datenbank zurücksetzen` funktionieren.
- Offline-Check:
- App lädt nach erstem Besuch ohne Netzwerk aus Cache.
- Regression-Check bei Pfadänderungen:
- Manifest- und SW-Pfade korrekt zum Deployment-Kontext.

## Bekannte Risiken / Inkonsistenzen
- Import-Refresh im Day-View liest Datum aus `textContent` des Date-Inputs statt aus `value`; kann Reload-Pfad verfälschen.
- CSV-Import dedupliziert nicht; mehrfacher Import erzeugt Mehrfacheinträge.
- PWA-Pfade sind fest auf `/edutimer/` gesetzt; bei anderem Hosting-Pfad brechen Start/Cache.
- `CLAUDE.md` enthält doppelte/teilweise divergierende Beschreibungen; für Änderungen immer Code gegenprüfen.
- `css/style.css` enthält Hover-Regel für `#entries-list li`, während Einträge als Tabellenzeilen (`tr`) gerendert werden.
