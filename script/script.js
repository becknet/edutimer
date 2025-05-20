// Database configuration
const DB_NAME = "TimeTrackerDB";
const DB_VERSION = 2;

// Object store names
const STORE_CONFIG = "config";
const STORE_ENTRIES = "entries";
const STORE_CATEGORIES = "categories";

// Default Kategories
const defaultCodes = ["A", "B", "C", "D", "E", "EA"];

// IndexedDB instance
let db;
// Current selected date for day view
let currentDate = new Date();
function openDB() {
    return new Promise((res, rej) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
            db = req.result;
            if (!db.objectStoreNames.contains(STORE_CONFIG))
                db.createObjectStore(STORE_CONFIG, {
                    keyPath: "id",
                });
            if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
                const es = db.createObjectStore(STORE_ENTRIES, {
                    keyPath: "id",
                    autoIncrement: true,
                });
                es.createIndex("by_date", "date", {
                    unique: false,
                });
            }
            if (!db.objectStoreNames.contains(STORE_CATEGORIES))
                db.createObjectStore(STORE_CATEGORIES, {
                    keyPath: "id",
                    autoIncrement: true,
                });
        };
        req.onsuccess = () => {
            db = req.result;
            res(db);
        };
        req.onerror = () => rej(req.error);
    });
}
function tx(storeName, mode = "readonly") {
    return db.transaction(storeName, mode).objectStore(storeName);
}
// default kategorien anlegen
async function seedCategories() {
    const all = await new Promise(
        (res) =>
            (tx(STORE_CATEGORIES).getAll().onsuccess = (e) =>
                res(e.target.result))
    );
    if (all.length === 0) {
        const defaults = [
            { code: "A", name: "Unterricht" },
            { code: "B", name: "Unterrichtsbezogene Aufgaben" },
            { code: "C", name: "Schulbezogene Aufgaben" },
            { code: "D", name: "Beratung" },
            { code: "E", name: "Personalentwicklung" },
            { code: "EA", name: "Spezialfunktionen" },
        ];
        const store = tx(STORE_CATEGORIES, "readwrite");
        defaults.forEach((cat) => store.add(cat));
    }
}

// --- Initialization functions ---
function initCategories() {
    const catForm = document.getElementById("cat-form"),
        catList = document.getElementById("cat-list"),
        modalCatSelect = document.getElementById("modal-category");
    catForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const codeInput = document.getElementById("cat-code");
        const nameInput = document.getElementById("cat-name");
        const code = codeInput.value.trim();
        const name = nameInput.value.trim();
        // Validate non-empty
        if (!code || !name) {
            alert("Bitte Code und Name eingeben.");
            return;
        }

        // Check for existing custom categories
        tx(STORE_CATEGORIES).getAll().onsuccess = (event) => {
            const allCats = event.target.result;
            if (allCats.some((cat) => cat.code === code)) {
                alert(
                    `Eine Kategorie mit dem Code "${code}" existiert bereits.`
                );
                codeInput.value = "";
                nameInput.value = "";
                return;
            }
            // Add new category
            tx(STORE_CATEGORIES, "readwrite").add({ code, name });
            catForm.reset();
            loadCategories();
        };
    });
    loadCategories();
}

// kategorien laden und anzeigen
function loadCategories() {
    const catList = document.getElementById("cat-list");
    const modalCatSelect = document.getElementById("modal-category");
    catList.innerHTML = "";
    modalCatSelect.innerHTML = "";
    tx(STORE_CATEGORIES).openCursor().onsuccess = (e) => {
        const cur = e.target.result;
        if (cur) {
            const c = cur.value;
            // Only display custom categories (not default) in config list
            if (!defaultCodes.includes(c.code)) {
                const li = document.createElement("li");
                li.classList.add(
                    "d-flex",
                    "justify-content-between",
                    "align-items-center"
                );
                li.textContent = `${c.code} - ${c.name}`;

                const del = document.createElement("i");
                del.className = "bi bi-trash delete-btn text-danger ms-2";
                del.title = "Löschen";
                del.addEventListener("click", () => {
                    if (confirm("Kategorie löschen?")) {
                        tx(STORE_CATEGORIES, "readwrite").delete(c.id);
                        loadCategories();
                    }
                });
                li.appendChild(del);
                catList.appendChild(li);
            }
            // All categories (default and custom) in modal select
            const modalOpt = document.createElement("option");
            modalOpt.value = c.code;
            modalOpt.textContent = `${c.code} ${c.name}`;
            modalCatSelect.appendChild(modalOpt);
            cur.continue();
        }
    };
}

// konfiguration laden
function loadConfig() {
    tx(STORE_CONFIG).get(1).onsuccess = (e) => {
        const c = e.target.result;
        if (c) {
            document.getElementById("year-hours").value = c.yearHours;
            document.getElementById("employment-rate").value = c.employment;
            document.getElementById("age").value = c.age || "";
            document.getElementById("year-start").value = c.start;
            document.getElementById("year-end").value = c.end;
        }
    };
}

// einträge des aktuellen Tages laden
function loadEntries(currentDate) {
    const dateEl = document.getElementById("current-date");
    const entriesList = document.getElementById("entries-list");

    // Display the provided date
    dateEl.textContent = currentDate.toLocaleDateString("de-DE");

    // Use date index to fetch only entries for currentDate, fallback to scan if index missing
    const isoDate = formatDateISO(currentDate);
    entriesList.innerHTML = "";
    let totalMinutes = 0;

    const store = db
        .transaction(STORE_ENTRIES, "readonly")
        .objectStore(STORE_ENTRIES);
    let fetchPromise;

    if (store.indexNames.contains("by_date")) {
        // Use index if available
        const idx = store.index("by_date");
        const range = IDBKeyRange.only(isoDate);
        fetchPromise = new Promise((res) => {
            idx.getAll(range).onsuccess = (e) => res(e.target.result || []);
        });
    } else {
        // Fallback: scan all entries and filter
        fetchPromise = new Promise((res) => {
            const results = [];
            store.openCursor().onsuccess = (e) => {
                const cursor = e.target.result;
                if (cursor) {
                    if (cursor.value.date === isoDate)
                        results.push(cursor.value);
                    cursor.continue();
                } else {
                    res(results);
                }
            };
        });
    }

    // einträge des aktuellen tages anzeigen
    fetchPromise.then((results) => {
        results.forEach((en) => {
            totalMinutes += en.minutes;
            const li = document.createElement("li");
            // Make each <li> a flex container, right-align icons
            li.classList.add(
                "d-flex",
                "justify-content-between",
                "align-items-center"
            );
            const contentDiv = document.createElement("div");
            contentDiv.className = "content";
            contentDiv.textContent = `${(en.minutes / 60).toFixed(2)}h | ${
                en.category
            } | ${en.note}`;

            // Create edit and delete icon buttons
            const editBtn = document.createElement("i");
            editBtn.className =
                "bi bi-pencil-square edit-btn text-primary ms-2";
            editBtn.title = "Bearbeiten";
            const deleteBtn = document.createElement("i");
            deleteBtn.className = "bi bi-trash delete-btn text-danger ms-2";
            deleteBtn.title = "Löschen";

            // Click handlers
            editBtn.addEventListener("click", () => {
                // Populate modal for editing
                document.getElementById("entryModalLabel").textContent =
                    "Eintrag bearbeiten";
                document.getElementById("modal-entry-id").value = en.id;
                document.getElementById("modal-hours").value = Math.floor(
                    en.minutes / 60
                );
                document.getElementById("modal-minutes").value =
                    en.minutes % 60;
                document.getElementById("modal-category").value = en.category;
                document.getElementById("modal-note").value = en.note;
                bootstrap.Modal.getOrCreateInstance(
                    document.getElementById("entryModal")
                ).show();
            });

            deleteBtn.addEventListener("click", () => {
                if (confirm("Eintrag löschen?")) {
                    tx(STORE_ENTRIES, "readwrite").delete(en.id);
                    loadEntries(currentDate);
                }
            });

            // Content on the left
            li.appendChild(contentDiv);
            // Icons on the right
            const iconContainer = document.createElement("div");
            iconContainer.classList.add("d-flex", "gap-2");
            iconContainer.appendChild(editBtn);
            iconContainer.appendChild(deleteBtn);
            li.appendChild(iconContainer);
            entriesList.appendChild(li);
        });
        // After populating
        document.querySelector("#day .total").textContent = `${Math.floor(
            totalMinutes / 60
        )}h ${totalMinutes % 60}min`;
    });
}

// statistik rechnen und anzeigen
function renderOverview() {
    const tbody = document.getElementById("overview-body");
    tbody.innerHTML = "";
    tx(STORE_CONFIG).get(1).onsuccess = (e) => {
        const c = e.target.result;
        if (!c) return;
        // Show the configured period in dd.mm.yyyy
        const startLocal = new Date(c.start).toLocaleDateString("de-DE");
        const endLocal = new Date(c.end).toLocaleDateString("de-DE");
        document.getElementById(
            "overview-period"
        ).textContent = `Zeitraum: ${startLocal} bis ${endLocal}`;
        const total = calculateRequiredHours(
            c.yearHours,
            c.employment,
            c.age,
            c.start,
            c.end
        );
        const groups = { "A+B": 0.874, "C+D+E": 0.126 };
        tx(STORE_ENTRIES).getAll().onsuccess = (ev) => {
            const entries = ev.target.result.filter(
                (it) => it.date >= c.start && it.date <= c.end
            );
            const sums = calculateGroupSums(entries);
            // Total actual minutes across both groups for IST percentage
            const ABCDETotalMinutes = sums["A+B"] + sums["C+D+E"];
            Object.entries(groups).forEach(([label, ratio]) => {
                const tr = document.createElement("tr");
                const sollHours = total * ratio;
                const istHours = sums[label] / 60;
                // Compute IST percent relative to total actual hours
                const istPercent = ABCDETotalMinutes
                    ? (sums[label] / ABCDETotalMinutes) * 100
                    : 0;
                tr.innerHTML = `
                    <td>${label}</td>
                    <td>${sollHours.toFixed(2)}</td>
                    <td>${(ratio * 100).toFixed(1)}</td>
                    <td>${istHours.toFixed(2)}</td>
                    <td>${istPercent.toFixed(1)}</td>
                `;
                tbody.appendChild(tr);
            });
            const catBody = document.getElementById("cat-overview-body");
            catBody.innerHTML = "";
            // Gesamt-IST-Minuten für Prozent-Basis
            const totalIstMinutes = entries.reduce(
                (sum, it) => sum + it.minutes,
                0
            );

            // Lade alle Kategorien dynamisch aus IndexedDB
            tx(STORE_CATEGORIES).getAll().onsuccess = (evCats) => {
                const categories = evCats.target.result; // Array von { id, code, name }
                categories.forEach((cat) => {
                    const minutesPerCat = entries
                        .filter((it) => it.category === cat.code)
                        .reduce((sum, it) => sum + it.minutes, 0);
                    const hours = minutesPerCat / 60;
                    const percent = totalIstMinutes
                        ? (minutesPerCat / totalIstMinutes) * 100
                        : 0;
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td class="text-start">${cat.code} ${cat.name}</td>
                        <td>${hours.toFixed(2)}</td>
                        <td>${percent.toFixed(1)}</td>
                        `;
                    catBody.appendChild(row);
                });
            };
        };
    };
}

// einträge ohne konfiguration löschen
function clearDB() {
    if (
        confirm(
            "Möchtest du wirklich alle Einträge löschen? Deine Einstellungen bleiben erhalten."
        )
    ) {
        const store = tx(STORE_ENTRIES, "readwrite");
        store.clear();
        // Refresh views
        renderOverview();
        // If currently in day view, reload entries for the shown date
        const active = document.querySelector("section.active");
        if (active && active.id === "day") {
            // Use the displayed date text to parse currentDate
            const parts = document
                .getElementById("current-date")
                .textContent.split(".");
            const d = new Date(parts.reverse().join("-"));
            loadEntries(d);
        }
    }
}

// datenbank löschen
function resetDB() {
    if (
        confirm(
            "Möchtest du wirklich die gesamte Datenbank löschen? Damit werden alle Einträge und die Einstellungen gelöscht."
        )
    ) {
        // Close any open connections before deletion
        if (db) db.close();
        const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
        deleteRequest.onsuccess = () => {
            // Reload the page to reinitialize
            location.reload();
        };
        deleteRequest.onerror = () => {
            alert("Fehler beim Löschen der Datenbank.");
        };
    }
}

// csv exportieren
function exportCSV() {
    tx(STORE_ENTRIES).getAll().onsuccess = (e) => {
        const all = e.target.result;
        if (!all.length) return alert("Keine Einträge.");
        const hdr = ["id", "date", "minutes", "category", "note"];
        const rows = all.map((o) =>
            hdr
                .map((h) => `"${(o[h] || "").toString().replace(/"/g, '""')}"`)
                .join(";")
        );
        const csv = [hdr.join(";"), ...rows].join("\r\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const now = new Date();
        const pad = (n) => n.toString().padStart(2, "0");
        const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
            now.getDate()
        )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(
            now.getSeconds()
        )}`;
        a.download = `EduTimer_Export_${ts}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };
}

// csv importieren
function importCSV() {
    const file = document.getElementById("import-input").files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split(/\r?\n/);
        const header = lines.shift(); // remove header
        lines.forEach((line) => {
            if (!line.trim()) return;
            const [id, date, minutes, category, note] = line
                .split(";")
                .map((s) => s.replace(/^"|"$/g, "").replace(/""/g, '"'));
            const entry = {
                date,
                minutes: Number(minutes),
                category,
                note,
            };
            tx(STORE_ENTRIES, "readwrite").add(entry);
        });
        // Refresh views
        renderOverview();
        const active = document.querySelector("section.active");
        if (active && active.id === "day") {
            const parts = document
                .getElementById("current-date")
                .textContent.split(".");
            const d = new Date(parts.reverse().join("-"));
            loadEntries(d);
        }
        document.getElementById("import-input").value = ""; // reset input
    };
    reader.readAsText(file);
}

function initConfig() {
    document.getElementById("config-form").addEventListener("submit", (e) => {
        e.preventDefault();
        // startdatum kleiner enddatum
        const startValue = document.getElementById("year-start").value;
        const endValue = document.getElementById("year-end").value;
        if (startValue >= endValue) {
            alert("Das Startdatum muss vor dem Enddatum liegen.");
            return;
        }
        const cfg = {
            id: 1,
            yearHours: +document.getElementById("year-hours").value,
            employment: +document.getElementById("employment-rate").value,
            age: +document.getElementById("age").value,
            start: startValue,
            end: endValue,
        };
        tx(STORE_CONFIG, "readwrite").put(cfg);
        alert("Konfiguration gespeichert");
    });
    loadConfig();
}

function initDayView() {
    // reuse global currentDate
    function update() {
        loadEntries(currentDate);
    }
    document.getElementById("prev-day").onclick = () => {
        currentDate.setDate(currentDate.getDate() - 1);
        update();
    };
    document.getElementById("next-day").onclick = () => {
        currentDate.setDate(currentDate.getDate() + 1);
        update();
    };
    update();
}

function initModal() {
    document.getElementById("new-entry-btn").addEventListener("click", () => {
        document.getElementById("entryModalLabel").textContent =
            "Neuer Eintrag";
        document.getElementById("modal-entry-form").reset();
        document.getElementById("modal-entry-id").value = "";
    });
    document.getElementById("save-entry-btn").addEventListener("click", () => {
        const modalForm = document.getElementById("modal-entry-form");
        if (!modalForm.checkValidity()) {
            modalForm.reportValidity();
            return;
        }
        const id = document.getElementById("modal-entry-id").value;
        const mins =
            Number(document.getElementById("modal-hours").value) * 60 +
            Number(document.getElementById("modal-minutes").value);
        if (mins <= 0) return alert("Bitte Zeit angeben");
        const entry = {
            date: formatDateISO(currentDate),
            minutes: mins,
            category: document.getElementById("modal-category").value,
            note: document.getElementById("modal-note").value.trim(),
        };
        if (id) entry.id = Number(id);
        const store = tx(STORE_ENTRIES, "readwrite");
        store[id ? "put" : "add"](entry);
        bootstrap.Modal.getInstance(
            document.getElementById("entryModal")
        ).hide();
        loadEntries(currentDate);
    });
}

function initNavigation() {
    document.querySelectorAll("nav button").forEach((b) => {
        b.onclick = () => {
            document
                .querySelectorAll("section")
                .forEach((s) => s.classList.remove("active"));
            document.getElementById(b.dataset.target).classList.add("active");
            if (b.dataset.target === "day") initDayView();
            if (b.dataset.target === "overview") renderOverview();
        };
    });
    document.querySelector('nav button[data-target="day"]').click();
}

// Helper: format Date object to 'YYYY-MM-DD'
function formatDateISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// Calculate total required hours based on config period
function calculateRequiredHours(
    yearHours,
    employmentPercent,
    age,
    startISO,
    endISO
) {
    const start = new Date(startISO),
        end = new Date(endISO);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    let total = yearHours * (employmentPercent / 100) * (days / 365);
    // Urlaubstage basierend auf Alter abziehen (8.4h pro Tag), skaliert mit Anstellungsgrad
    const vacDays = age < 50 ? 25 : age < 60 ? 27 : 30;
    const vacHours = vacDays * 8.4 * (employmentPercent / 100);
    total -= vacHours;
    return total;
}

// Calculate minutes sum per group from entry array
function calculateGroupSums(entries) {
    const sums = { "A+B": 0, "C+D+E": 0 };
    entries.forEach((it) => {
        if (["A", "B"].includes(it.category)) sums["A+B"] += it.minutes;
        if (["C", "D", "E"].includes(it.category)) sums["C+D+E"] += it.minutes;
    });
    return sums;
}

// --- DOMContentLoaded ---
document.addEventListener("DOMContentLoaded", () => {
    (async () => {
        await openDB();
        await seedCategories();
        initCategories();
        initConfig();
        initModal();
        initNavigation();
        
        document
            .getElementById("export-btn")
            .addEventListener("click", exportCSV);
        document
            .getElementById("import-input")
            .addEventListener("change", () => {
                importCSV();
                alert("CSV wurde erfogreich importiert.");
            });
        document
            .getElementById("clear-entries-btn")
            .addEventListener("click", clearDB);
        document
            .getElementById("reset-db-btn")
            .addEventListener("click", resetDB);
    })();
    var tooltipTriggerList = [].slice.call(
        document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.forEach(function (el) {
        new bootstrap.Tooltip(el, { html: true });
    });
});
