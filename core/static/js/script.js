 document.addEventListener("DOMContentLoaded", function() {
        
        // --- 1. LIVE UHRZEIT, DATUM & BEGRÜSSUNG ---
        function updateClockAndGreeting() {
            const now = new Date();
            
            // Uhrzeit formatieren (HH:MM:SS)
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
        
            
            // Datum formatieren
            const options = { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' };
            const dateString = now.toLocaleDateString('de-DE', options).replace(',','');

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
    });


document.addEventListener("DOMContentLoaded", function() {
    
    // Hilfsfunktion zum Öffnen und Schließen der Popovers
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

    // Popovers für Notizblatt und Formen verknüpfen
    setupPopover("stickyNoteBtn", "stickyColorPopover");
    setupPopover("shapesBtn", "shapesPopover");

    // Klick außerhalb schließt alle geöffneten Popovers
    document.addEventListener("click", function(e) {
        if (!e.target.closest('.wb_popover_wrapper')) {
            document.querySelectorAll('.wb_popover').forEach(p => {
                p.classList.remove('active');
            });
        }
    });

});