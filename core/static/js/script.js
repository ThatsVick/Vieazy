document.addEventListener("DOMContentLoaded", function() {

    // --- 1. LIVE UHRZEIT, DATUM & BEGRÜSSUNG ---
    function updateClockAndGreeting() {
        const now = new Date();
        
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');

        const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
        const dateString = now.toLocaleDateString('de-DE', options).replace(',', '');

        const clockEl = document.getElementById('clock');
        const dateEl = document.getElementById('date');
        const greetingEl = document.getElementById('greeting_text');

        if (clockEl) clockEl.innerText = `${hours}:${minutes}`;
        if (dateEl) dateEl.innerText = dateString;

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
            
            document.querySelectorAll('.wb_popover').forEach(p => {
                if (p !== popover) p.classList.remove('active');
            });

            popover.classList.toggle('active');
        });
    }

    setupPopover("stickyNoteBtn", "stickyColorPopover");
    setupPopover("shapesBtn", "shapesPopover");

    document.addEventListener("click", function(e) {
        if (!e.target.closest('.wb_popover_wrapper')) {
            document.querySelectorAll('.wb_popover').forEach(p => {
                p.classList.remove('active');
            });
        }
    });


    // --- 4. POPUP & SIDEBAR EVENT LISTENER (RECHTE SIDEBAR) ---
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.wb_sidebar_item')) {
            document.querySelectorAll('.wb_tool_popup').forEach(popup => {
                popup.classList.add('wb_hidden');
            });
        }
    });

    const focusPreventSelectors = '.wb_icon_btn, .wb_popup_btn, .wb_color_square, .wb_color_reset_btn';
    document.querySelectorAll(focusPreventSelectors).forEach(button => {
        button.addEventListener('mousedown', function(event) {
            event.preventDefault();
        });
    });

    const wbDoc = document.querySelector('.wb_document');
    if (wbDoc) {
        wbDoc.addEventListener('click', function() {
            this.focus();
        });
    }

    // Initialisierung der Haupt-Ordneransicht
    renderLayer1Folders();
});


// --- 5. GLOBALE EDITOR HELFER-FUNKTIONEN ---
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

function formatText(command, value = null) {
    document.execCommand(command, false, value);
    document.querySelectorAll('.wb_tool_popup').forEach(popup => {
        popup.classList.add('wb_hidden');
    });
}

function applyHighlight(color) {
    document.execCommand('hiliteColor', false, color);
    document.execCommand('backColor', false, color);
    document.querySelectorAll('.wb_tool_popup').forEach(popup => {
        popup.classList.add('wb_hidden');
    });
}

function applyTextColor(color) {
    const targetColor = (color === 'inherit') ? '#ffffff' : color;
    document.execCommand('foreColor', false, targetColor);
    document.querySelectorAll('.wb_tool_popup').forEach(popup => {
        popup.classList.add('wb_hidden');
    });
}


// --- 6. SPEICHER & BREADCRUMB-NAVIGATION ---

let customFolders = JSON.parse(localStorage.getItem('wb_custom_folders')) || [];

let savedNotes = JSON.parse(localStorage.getItem('wb_saved_notes')) || [
    {
        id: 1,
        date: "2026-10-16",
        year: "2026",
        month: "Oktober",
        theme: "Projekt Whiteboard",
        tags: ["CSS", "JS", "Design"],
        folder: "Archiv",
        thumbnail: "https://via.placeholder.com/300x180/00f0ff/000000?text=Notiz+16.10"
    }
];

// Pfad-Array für genaue Ebenen-Rückverfolgung (Breadcrumbs)
let currentPath = [];


// --- NAVIGATION ZWISCHEN DEN EBENEN ---

function goOneLevelUp() {
    if (currentPath.length > 0) {
        currentPath.pop(); // Entfernt den aktuellen Ordner aus dem Pfad
        
        if (currentPath.length === 0) {
            goToLayer1();
        } else {
            const parentFolder = currentPath[currentPath.length - 1];
            openCustomFolderNotes(parentFolder, true);
        }
    } else {
        goToLayer1();
    }
}

function goToLayer1() {
    currentPath = [];
    document.getElementById('wb_layer_1')?.classList.remove('wb_hidden_layer');
    document.getElementById('wb_layer_2')?.classList.add('wb_hidden_layer');
    document.getElementById('wb_layer_3')?.classList.add('wb_hidden_layer');
    renderLayer1Folders();
}

function goToLayer2() {
    document.getElementById('wb_layer_1')?.classList.add('wb_hidden_layer');
    document.getElementById('wb_layer_2')?.classList.remove('wb_hidden_layer');
    document.getElementById('wb_layer_3')?.classList.add('wb_hidden_layer');
    renderLayer2Archive();
}

function goToLayer3(monthYearName) {
    document.getElementById('wb_layer_2')?.classList.add('wb_hidden_layer');
    document.getElementById('wb_layer_3')?.classList.remove('wb_hidden_layer');
    
    const titleEl = document.getElementById('wb_layer3_title');
    if (titleEl) titleEl.innerText = `Archiv: ${monthYearName}`;
    
    renderLayer3Content(monthYearName, true);
}

function openCustomFolderNotes(folderName, isBackNavigation = false) {
    if (!isBackNavigation) {
        if (currentPath[currentPath.length - 1] !== folderName) {
            currentPath.push(folderName);
        }
    }

    document.getElementById('wb_layer_1')?.classList.add('wb_hidden_layer');
    document.getElementById('wb_layer_2')?.classList.add('wb_hidden_layer');
    document.getElementById('wb_layer_3')?.classList.remove('wb_hidden_layer');
    
    const titleEl = document.getElementById('wb_layer3_title');
    if (titleEl) titleEl.innerText = `Ordner: ${currentPath.join(' / ')}`;
    
    renderLayer3Content(folderName, false);
}


// --- RENDERING-LOGIK (EBENE 1, 2 UND 3) ---

function renderLayer1Folders() {
    const grid = document.getElementById('wb_main_folder_grid');
    if (!grid) return;

    const existingCustom = grid.querySelectorAll('.wb_custom_type');
    existingCustom.forEach(el => el.remove());

    // Zeigt nur Ordner ohne Überordner (Root-Ebene)
    const rootFolders = customFolders.filter(f => typeof f === 'string' || !f.parent);

    rootFolders.forEach((folder) => {
        const folderName = typeof folder === 'object' ? folder.name : folder;
        const card = document.createElement('div');
        card.className = 'wb_card_item wb_custom_type';
        card.innerHTML = `
            <div class="wb_card_icon"><i class="fas fa-folder"></i></div>
            <div class="wb_card_title">${folderName}</div>
            <button class="wb_folder_delete_btn" onclick="deleteFolder(event, '${folderName}')" title="Ordner löschen">
                <i class="fas fa-times"></i>
            </button>
        `;
        card.onclick = () => openCustomFolderNotes(folderName);
        grid.appendChild(card);
    });
}

function renderLayer2Archive() {
    const monthsGrid = document.getElementById('wb_archive_months_grid');
    if (!monthsGrid) return;
    
    monthsGrid.innerHTML = "";

    const archiveNotes = savedNotes.filter(n => n.folder === "Archiv" || !n.folder);
    const activeMonths = [...new Set(archiveNotes.map(note => `${note.month} ${note.year}`))];

    if (activeMonths.length === 0) {
        monthsGrid.innerHTML = "<p style='color:#888; grid-column: 1/-1;'>Keine archivierten Notizen vorhanden.</p>";
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

function renderLayer3Content(currentFolderName, isArchive) {
    const notesGrid = document.getElementById('wb_notes_grid');
    if (!notesGrid) return;
    
    notesGrid.innerHTML = "";

    // 1. Unterordner für den aktuellen Ordner laden und anzeigen
    if (!isArchive) {
        const subFolders = customFolders.filter(f => typeof f === 'object' && f.parent === currentFolderName);

        subFolders.forEach((sub) => {
            const card = document.createElement('div');
            card.className = 'wb_card_item wb_custom_type';
            card.innerHTML = `
                <div class="wb_card_icon"><i class="fas fa-folder"></i></div>
                <div class="wb_card_title">${sub.name}</div>
                <button class="wb_folder_delete_btn" onclick="deleteFolder(event, '${sub.name}')" title="Ordner löschen">
                    <i class="fas fa-times"></i>
                </button>
            `;
            card.onclick = () => openCustomFolderNotes(sub.name);
            notesGrid.appendChild(card);
        });
    }

    // 2. Notizen in diesem Ordner laden und anzeigen
    const filteredNotes = savedNotes.filter(note => {
        if (isArchive) {
            return `${note.month} ${note.year}` === currentFolderName;
        } else {
            return note.folder === currentFolderName;
        }
    });

    filteredNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = 'wb_note_card_box';
        card.innerHTML = `
            <div class="wb_note_header_row">
                <span class="wb_note_theme_text">${note.theme}</span>
                <i class="fas fa-tags wb_tag_trigger_icon" onclick="showTags('${(note.tags || []).join(', ')}')"></i>
            </div>
            
            <div class="wb_note_thumb_container" onclick="openPreviewModal('${note.thumbnail}')">
                <img src="${note.thumbnail}" alt="Thumbnail">
            </div>

            <div class="wb_note_action_row">
                <button class="wb_action_icon_btn" title="Teilen" onclick="shareAction()"><i class="fas fa-share-alt"></i></button>
                <button class="wb_action_icon_btn" title="Bearbeiten" onclick="editAction(${note.id})"><i class="fas fa-edit"></i></button>
                <button class="wb_action_icon_btn" title="Löschen" onclick="deleteNoteAction(${note.id})"><i class="fas fa-trash"></i></button>
                <button class="wb_action_icon_btn" title="Download" onclick="downloadAction(${note.id})"><i class="fas fa-download"></i></button>
            </div>
        `;
        notesGrid.appendChild(card);
    });

    // Platzhaltertext, wenn Ordner komplett leer ist
    const hasSubFolders = !isArchive && customFolders.some(f => typeof f === 'object' && f.parent === currentFolderName);
    if (!hasSubFolders && filteredNotes.length === 0) {
        notesGrid.innerHTML = "<p style='color:#888; grid-column: 1/-1;'>Dieser Ordner ist leer.</p>";
    }
}


// --- ORDNER POPUP & MANAGEMENT FUNKTIONEN ---

function addNewFolder() {
    const modal = document.getElementById('wb_folder_input_modal');
    const input = document.getElementById('wb_new_folder_input');
    if (modal && input) {
        input.value = "";
        modal.classList.remove('wb_hidden_layer');
        input.focus();
    }
}

function closeFolderInputModal() {
    const modal = document.getElementById('wb_folder_input_modal');
    if (modal) modal.classList.add('wb_hidden_layer');
}

function confirmAddNewFolder() {
    const input = document.getElementById('wb_new_folder_input');
    if (!input) return;

    const name = input.value;
    if (name && name.trim() !== "") {
        const cleanName = name.trim();
        const currentParent = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;

        // Ordner-Objekt mit Verknüpfung zum Eltern-Ordner erstellen
        const newFolderObj = {
            name: cleanName,
            parent: currentParent
        };

        // Prüfen, ob der Ordnername in dieser Ebene bereits existiert
        const exists = customFolders.some(f => {
            const fName = typeof f === 'object' ? f.name : f;
            const fParent = typeof f === 'object' ? f.parent : null;
            return fName.toLowerCase() === cleanName.toLowerCase() && fParent === currentParent;
        });

        if (exists || cleanName.toLowerCase() === "archiv") {
            alert("Ein Ordner mit diesem Namen existiert hier bereits!");
            return;
        }

        customFolders.push(newFolderObj);
        localStorage.setItem('wb_custom_folders', JSON.stringify(customFolders));

        if (currentParent) {
            openCustomFolderNotes(currentParent, true);
        } else {
            renderLayer1Folders();
        }
        
        closeFolderInputModal();
    }
}

function deleteFolder(event, folderName) {
    event.stopPropagation();
    
    if (confirm(`Möchtest du den Ordner "${folderName}" wirklich löschen?`)) {
        // Entfernt den Ordner sowie alle enthaltenen Unterordner
        customFolders = customFolders.filter(f => {
            const fName = typeof f === 'object' ? f.name : f;
            const fParent = typeof f === 'object' ? f.parent : null;
            return fName !== folderName && fParent !== folderName;
        });

        localStorage.setItem('wb_custom_folders', JSON.stringify(customFolders));

        if (currentPath.length > 0) {
            const currentParent = currentPath[currentPath.length - 1];
            openCustomFolderNotes(currentParent, true);
        } else {
            renderLayer1Folders();
        }
    }
}


// --- POPUPS & NOTIZ-AKTIONEN ---

function openPreviewModal(imgUrl) {
    const imgEl = document.getElementById('wb_modal_img');
    const modalEl = document.getElementById('wb_preview_modal');
    if (imgEl && modalEl) {
        imgEl.src = imgUrl;
        modalEl.classList.remove('wb_hidden_layer');
    }
}

function closePreviewModal() {
    const modalEl = document.getElementById('wb_preview_modal');
    if (modalEl) modalEl.classList.add('wb_hidden_layer');
}

function showTags(tagsString) {
    alert("Genutzte Tags: " + (tagsString || "Keine Tags angegeben"));
}

function deleteNoteAction(id) {
    if (confirm("Möchtest du diese Notiz wirklich löschen?")) {
        savedNotes = savedNotes.filter(n => n.id !== id);
        localStorage.setItem('wb_saved_notes', JSON.stringify(savedNotes));
        goOneLevelUp();
    }
}

function shareAction() { alert("Teilen-Funktion folgt bald!"); }
function editAction(id) { window.location.href = "index.html"; }
function downloadAction(id) { alert("Download gestartet..."); }

function handleSearch() {
    // Such-Logik für Thema/Tags über alle Dateien
}