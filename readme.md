# EduTimer – Zeiterfassung für Lehrpersonen

Eine leichte Web-App zur lokalen Zeiterfassung, optimiert für Lehrpersonen. Nutzt IndexedDB im Browser, lässt sich als PWA auf iOS/Android installieren und funktioniert komplett offline.

---

## Features

- **Konfiguration**
  - Jahresarbeitszeit in Stunden
  - Anstellungsgrad in Prozent (z.B. 79.12 %)
  - Alter in Jahren (berechnet zusätzliche Urlaubstage)
  - Start- und Enddatum des Schuljahres

- **Kategorien**
  - Standardkategorien: A, B, C, D, E, EA
  - Eigene Kategorien anlegen und löschen

- **Tagesansicht**
  - Navigation der Tage per ‹–› Buttons
  - Einträge werden jeweils zugehörig zum ausgewählten Tag angezeigt
  - „Neuer Eintrag“ und Bearbeitung per Bootstrap-Modal
  - Swipe-Gesten: links wischen = löschen, rechts wischen = bearbeiten
  - Tages-Summe (Stunden & Minuten)

- **Übersicht**
  - SOLL/Stunden- und Prozentwerte (A+B, C+D+E)
  - IST/Stunden- und Prozentwerte (A,B,C,D,E,EA,eigene Kategorien)
  - CSV-Export & CSV-Import
  - Button zum Löschen aller Einträge (Konfiguration & Kategorien bleiben erhalten)
  - Löschen der ganzen DB

- **PWA-Support**
  - `favicon.png` als App-Icon
  - `<link rel="apple-touch-icon">` für iOS-Home-Screen
  - `apple-mobile-web-app-capable` für Vollbildmodus

---

## Nutzung über URL
https://becknet.github.io/edutimer/

---

## Als App speichern ##
   - In Safari (iOS): Teilen → Zum Home-Bildschirm.  
   - In Chrome (Android): Menü → Zum Startbildschirm.

---

## Installation & Nutzung lokal

1. **Klonen oder Herunterladen**  
   Kopiere den Ordner `EduTimer` in Dein Web-Server-Verzeichnis (z.B. `htdocs`, `www`).

2. **Aufruf im Browser**  
   Öffne `index.html` per `http://localhost/EduTimer/index.html` oder direkt als Datei.

3. **Konfiguration**  
   - Jahresarbeitszeit, Anstellungsgrad, Alter, Start/Ende eingeben und „Speichern“ klicken.

4. **Einträge erfassen**  
   - Tagesansicht öffnen, „Neuer Eintrag“ klicken, Zeit/Kategorie/Bemerkung ausfüllen.

5. **Übersicht & Export/Import**  
   - Übersicht zeigt SOLL/IST.  
   - Export als CSV.  
   - Import über CSV-Datei.
   
---

## Tech-Stack

- **IndexedDB** für lokale Datenspeicherung  
- **Vanilla JavaScript** (kein Framework)  
- **Bootstrap 5** + **Bootstrap Icons**  
- **PWA-fähig** via Apple-Meta-Tags

---

## Datenschutz

Daten werden nur auf dem lokalen Gerät gespeichert.
Du bist für die Sicherung deiner Daten -> Export CSV selbst verantwortlich.
Der Author lehnt jede Haftung für den Verluste deiner Daten ab.

---

## Lizenz

MIT License – frei nutzbar und anpassbar.