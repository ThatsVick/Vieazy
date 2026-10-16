document.addEventListener("DOMContentLoaded", function() {

    // --- 1. LIVE UHRZEIT, DATUM & BEGRÜSSUNG ---
    function updateClockAndGreeting() {
        const now = new Date();
        
        // Uhrzeit formatieren (HH:MM)
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        // Datum formatieren
        const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
        const dateString = now.toLocaleDateString('de-DE', options).replace(',', '');

        const clockEl = document.getElementById('clock');
        const dateEl = document.getElementById('date');
        const greetingEl = document.getElementById('greeting_text');

        if (clockEl) clockEl.innerText = `${hours}:${minutes}`;
        if (dateEl) dateEl.innerText = dateString;

        // Begrüßung nach Tageszeit
        if (greetingEl) {
            const currentHour = now.getHours();
            let greeting = "Guten Tag";
            
            if (currentHour >= 5 && currentHour < 12) {
                greeting = "Guten Morgen";
            } else if (currentHour >= 12 && currentHour < 18) {
                greeting = "Guten Tag";
            } else if (currentHour >= 18 && currentHour < 23) {
                greeting = "Guten Abend";
            } else {
                greeting = "Gute Nacht";
            }
            
            greetingEl.innerText = greeting;
        }
    }

    // Uhrzeit sofort laden & jede Sekunde aktualisieren
    updateClockAndGreeting();
    setInterval(updateClockAndGreeting, 1000);


    // --- 2. WETTER WIDGET ---
    async function fetchWeather(city) {
        const tempEl = document.getElementById('weather_temp');
        const cityEl = document.getElementById('weather_city');
        const iconEl = document.getElementById('weather_icon');

        if (!tempEl || !cityEl || !iconEl) return;

        try {
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de&format=json`);
            const geoData = await geoRes.json();

            if (!geoData.results || geoData.results.length === 0) return;

            const { latitude, longitude, name } = geoData.results[0];

            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
            const weatherData = await weatherRes.json();

            const temp = Math.round(weatherData.current_weather.temperature);
            const weatherCode = weatherData.current_weather.weathercode;

            tempEl.innerText = `${temp} °C`;
            cityEl.innerText = name;
            iconEl.innerText = getWeatherIcon(weatherCode);

        } catch (error) {
            console.error("Wetter-Fehler:", error);
            tempEl.innerText = "-- °C";
        }
    }

    function getWeatherIcon(code) {
        if (code === 0) return "☀️";
        if (code >= 1 && code <= 3) return "⛅";
        if (code >= 45 && code <= 48) return "🌫️";
        if (code >= 51 && code <= 67) return "🌧️";
        if (code >= 71 && code <= 77) return "❄️";
        if (code >= 95) return "⛈️";
        return "🌡️";
    }

    const currentCity = localStorage.getItem('user_city') || "Berlin";
    fetchWeather(currentCity);


    // --- 3. POPOVER STEUERUNG (LINKE SIDEBAR) ---
    function setupPopover(btnId, popoverId) {
        const btn = document.getElementById(btnId);
        const popover = document.getElementById(popoverId);

        if (!btn || !popover) return;

        btn.addEventListener("click", function(e) {
            e.stopPropagation();
            
            // Alle anderen offenen Popovers schließen
            document.querySelectorAll('.wb_popover').forEach(p => {
                if (p !== popover) p.classList.remove('active');
            });

            // Aktuelles Popover umschalten
            popover.classList.toggle('active');
        });
    }

    setupPopover("stickyNoteBtn", "stickyColorPopover");
    setupPopover("shapesBtn", "shapesPopover");

    // Klick außerhalb schließt linke Popovers
    document.addEventListener("click", function(e) {
        if (!e.target.closest('.wb_popover_wrapper')) {
            document.querySelectorAll('.wb_popover').forEach(p => {
                p.classList.remove('active');
            });
        }
    });


    // --- 4. POPUP & SIDEBAR EVENT LISTENER (RECHTE SIDEBAR) ---
    
    // Schließt rechte Pop-ups, wenn man außerhalb klickt
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.wb_sidebar_item')) {
            document.querySelectorAll('.wb_tool_popup').forEach(popup => {
                popup.classList.add('wb_hidden');
            });
        }
    });

    // Verhindert Fokus-Verlust beim Klicken auf Buttons & Farbfelder
    const focusPreventSelectors = '.wb_icon_btn, .wb_popup_btn, .wb_color_square, .wb_color_reset_btn';
    document.querySelectorAll(focusPreventSelectors).forEach(button => {
        button.addEventListener('mousedown', function(event) {
            event.preventDefault();
        });
    });

    // Garantiert Fokus beim Klick in den Schreibbereich
    const wbDoc = document.querySelector('.wb_document');
    if (wbDoc) {
        wbDoc.addEventListener('click', function() {
            this.focus();
        });
    }
});


// --- 5. GLOBALE HELFER-FUNKTIONEN (Müssen außerhalb stehen, da sie per onclick im HTML aufgerufen werden) ---

// Pop-ups der rechten Sidebar umschalten
function togglePopup(popupId) {
    document.querySelectorAll('.wb_tool_popup').forEach(popup => {
        if (popup.id !== popupId) {
            popup.classList.add('wb_hidden');
        }
    });
    
    const targetPopup = document.getElementById(popupId);
    if (targetPopup) {
        targetPopup.classList.toggle('wb_hidden');
    }
}

// Universal-Funktion für Textformatierungen
function formatText(command, value = null) {
    document.execCommand(command, false, value);
    
    document.querySelectorAll('.wb_tool_popup').forEach(popup => {
        popup.classList.add('wb_hidden');
    });
}

// Texthintergrund ändern
function applyHighlight(color) {
    document.execCommand('hiliteColor', false, color);
    document.execCommand('backColor', false, color);

    document.querySelectorAll('.wb_tool_popup').forEach(popup => {
        popup.classList.add('wb_hidden');
    });
}

// Textfarbe ändern
function applyTextColor(color) {
    const targetColor = (color === 'inherit') ? '#ffffff' : color;
    document.execCommand('foreColor', false, targetColor);

    document.querySelectorAll('.wb_tool_popup').forEach(popup => {
        popup.classList.add('wb_hidden');
    });
}





// Beispieldaten-Speicher (Simuliert gespeicherte Notizen)
let savedNotes = [
    {
        id: 1,
        date: "2026-10-16",
        year: "2026",
        month: "Oktober",
        theme: "Projekt Whiteboard",
        tags: ["CSS", "JS", "Design"],
        thumbnail: "https://via.placeholder.com/300x180/00f0ff/000000?text=Notiz+16.10"
    }
];

let customFolders = JSON.parse(localStorage.getItem('wb_custom_folders')) || ["Privat", "Arbeit"];

document.addEventListener("DOMContentLoaded", function() {
    renderLayer1Folders();
});

// --- EBENE 1 LOGIK ---
function renderLayer1Folders() {
    const grid = document.getElementById('wb_main_folder_grid');
    
    // Nur benutzerdefinierte Ordner neu rendern (Archiv bleibt fest)
    const existingCustom = grid.querySelectorAll('.wb_custom_type');
    existingCustom.forEach(el => el.remove());

    customFolders.forEach((folderName, index) => {
        const card = document.createElement('div');
        card.className = 'wb_card_item wb_custom_type';
        card.innerHTML = `
            <div class="wb_card_icon"><i class="fas fa-folder"></i></div>
            <div class="wb_card_title">${folderName}</div>
        `;
        // Klick auf eigenen Ordner führt direkt zu dessen Notizen (Ebene 3)
        card.onclick = () => openCustomFolderNotes(folderName);
        grid.appendChild(card);
    });
}

function addNewFolder() {
    const name = prompt("Wie soll der neue Ordner heißen?");
    if (name && name.trim() !== "") {
        customFolders.push(name.trim());
        localStorage.setItem('wb_custom_folders', JSON.stringify(customFolders));
        renderLayer1Folders();
    }
}

// --- NAVIGATION ZWISCHEN DEN EBENEN ---
function goToLayer1() {
    document.getElementById('wb_layer_1').classList.remove('wb_hidden_layer');
    document.getElementById('wb_layer_2').classList.add('wb_hidden_layer');
    document.getElementById('wb_layer_3').classList.add('wb_hidden_layer');
}

function goToLayer2() {
    document.getElementById('wb_layer_1').classList.add('wb_hidden_layer');
    document.getElementById('wb_layer_2').classList.remove('wb_hidden_layer');
    document.getElementById('wb_layer_3').classList.add('wb_hidden_layer');
    renderLayer2Archive();
}

function goToLayer3(monthName) {
    document.getElementById('wb_layer_2').classList.add('wb_hidden_layer');
    document.getElementById('wb_layer_3').classList.remove('wb_hidden_layer');
    document.getElementById('wb_layer3_title').innerText = `Notizen - ${monthName}`;
    renderLayer3Notes(monthName);
}

function openCustomFolderNotes(folderName) {
    document.getElementById('wb_layer_1').classList.add('wb_hidden_layer');
    document.getElementById('wb_layer_3').classList.remove('wb_hidden_layer');
    document.getElementById('wb_layer3_title').innerText = `Ordner: ${folderName}`;
    renderLayer3Notes(folderName);
}

// --- EBENE 2 LOGIK (ARCHIV / MONATE) ---
function renderLayer2Archive() {
    const monthsGrid = document.getElementById('wb_archive_months_grid');
    monthsGrid.innerHTML = "";

    // Zeigt nur Monate an, in denen auch tatsächlich Notizen vorhanden sind
    const activeMonths = [...new Set(savedNotes.map(note => `${note.month} ${note.year}`))];

    if (activeMonths.length === 0) {
        monthsGrid.innerHTML = "<p>Keine archivierten Notizen vorhanden.</p>";
        return;
    }

    activeMonths.forEach(monthYear => {
        const card = document.createElement('div');
        card.className = 'wb_card_item';
        card.innerHTML = `
            <div class="wb_card_icon"><i class="fas fa-calendar-alt"></i></div>
            <div class="wb_card_title">${monthYear}</div>
        `;
        card.onclick = () => goToLayer3(monthYear);
        monthsGrid.appendChild(card);
    });
}

// --- EBENE 3 LOGIK (NOTIZEN / TAGE) ---
function renderLayer3Notes(filter) {
    const notesGrid = document.getElementById('wb_notes_grid');
    notesGrid.innerHTML = "";

    savedNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'wb_note_card_box';
        card.innerHTML = `
            <div class="wb_note_header_row">
                <span class="wb_note_theme_text">${note.theme}</span>
                <i class="fas fa-tags wb_tag_trigger_icon" onclick="showTags('${note.tags.join(', ')}')"></i>
            </div>
            
            <div class="wb_note_thumb_container" onclick="openPreviewModal('${note.thumbnail}')">
                <img src="${note.thumbnail}" alt="Thumbnail">
            </div>

            <div class="wb_note_action_row">
                <button class="wb_action_icon_btn" title="Teilen" onclick="shareAction()"><i class="fas fa-share-alt"></i></button>
                <button class="wb_action_icon_btn" title="Bearbeiten" onclick="editAction(${note.id})"><i class="fas fa-edit"></i></button>
                <button class="wb_action_icon_btn" title="Löschen" onclick="deleteAction(${note.id})"><i class="fas fa-trash"></i></button>
                <button class="wb_action_icon_btn" title="Download" onclick="downloadAction(${note.id})"><i class="fas fa-download"></i></button>
            </div>
        `;
        notesGrid.appendChild(card);
    });
}

// --- MODAL & TAG POPUP ---
function openPreviewModal(imgUrl) {
    document.getElementById('wb_modal_img').src = imgUrl;
    document.getElementById('wb_preview_modal').classList.remove('wb_hidden_layer');
}

function closePreviewModal() {
    document.getElementById('wb_preview_modal').classList.add('wb_hidden_layer');
}

function showTags(tagsString) {
    alert("Genutzte Tags: " + tagsString);
}

// --- AKTIONEN ---
function shareAction() { alert("Teilen-Funktion folgt bald!"); }
function editAction(id) { window.location.href = "index.html"; }
function deleteAction(id) { alert("Notiz gelöscht!"); }
function downloadAction(id) { alert("Download gestartet..."); }

function handleSearch() {
    // Such-Logik für Thema/Tags über alle Dateien
}