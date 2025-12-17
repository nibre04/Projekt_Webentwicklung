const API_KEY = "d51fvd1r01qhn003ot8gd51fvd1r01qhn003ot90";
const BASE_URL = "https://finnhub.io/api/v1";

/**
 * Hilfsfunktion: Formatiert eine Zahl als USD Woverrightarrowhrung
 */
function formatWaehrung(zahl) {
    if (!zahl && zahl !== 0) return "-";
    return new Intl.NumberFormat('en-US', {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(zahl);
}

/**
 * Hilfsfunktion: Formatiert Prozentwerte mit Farbe
 * @returns HTML String mit entsprechender Klasse
 */
function formatProzent(zahl) {
    if (!zahl && zahl !== 0) return "<span>-</span>";
    const cssKlasse = zahl >= 0 ? 'kurs-positiv' : 'kurs-negativ';
    const vorzeichen = zahl >= 0 ? '+' : '';
    return `<span class="${cssKlasse}">${vorzeichen}${zahl.toFixed(2)}%</span>`;
}

/**
 * Funktion fǬr index.html: Startet die Suche und leitet weiter
 */
function starteAnalyse() {
    const eingabeFeld = document.getElementById('nutzerSuche');
    const symbol = eingabeFeld.value.trim().toUpperCase();

    if (symbol) {
        window.location.href = `details.html?symbol=${symbol}`;
    } else {
        alert("Bitte geben Sie ein KǬrzel ein.");
    }
}

// Event Listener fǬr die Enter-Taste im Suchfeld
const suchFeld = document.getElementById('nutzerSuche');
if (suchFeld) {
    suchFeld.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            starteAnalyse();
        }
    });
}


/**
 * Funktion fǬr details.html: LǕdt Firmendaten und Kursdaten
 */
async function holeAktienDetails() {
    const params = new URLSearchParams(window.location.search);
    const symbol = params.get('symbol');

    if (!symbol) {
        window.location.href = 'index.html';
        return;
    }

    try {
        // Parallel beide Abfragen starten fǬr mehr Performance
        const [profilResponse, quoteResponse] = await Promise.all([
            fetch(`${BASE_URL}/stock/profile2?symbol=${symbol}&token=${API_KEY}`),
            fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`)
        ]);

        const profilDaten = await profilResponse.json();
        const quoteDaten = await quoteResponse.json();

        // Ladebildschirm ausblenden, Inhalt einblenden
        document.getElementById('ladeBildschirm').classList.add('d-none');
        document.getElementById('aktienDetailBereich').classList.remove('d-none');

        // Daten ins UI fǬllen
        // Profil
        document.getElementById('anzeigeFirmenName').textContent = profilDaten.name || symbol;
        document.getElementById('anzeigeKuerzel').textContent = symbol;
        document.getElementById('anzeigeBranche').textContent = profilDaten.finnhubIndustry || 'N/A';

        const logoImg = document.getElementById('firmenLogo');
        if (profilDaten.logo) {
            logoImg.src = profilDaten.logo;
        } else {
            // Fallback, falls kein Logo da ist
            logoImg.style.display = 'none';
        }

        // Kursdaten (c = current, o = open, h = high, l = low, pc = previous close)
        document.getElementById('anzeigeAktuellerKurs').textContent = formatWaehrung(quoteDaten.c);

        document.getElementById('wertEroeffnung').textContent = formatWaehrung(quoteDaten.o);
        document.getElementById('wertHoch').textContent = formatWaehrung(quoteDaten.h);
        document.getElementById('wertTief').textContent = formatWaehrung(quoteDaten.l);
        document.getElementById('wertSchlussVortag').textContent = formatWaehrung(quoteDaten.pc);


    } catch (error) {
        console.error("Fehler beim Abrufen der Daten:", error);
        alert("Fehler beim Laden der Daten. Bitte ǬberprǬfen Sie das Symbol oder versuchen Sie es spǕter erneut.");
        document.getElementById('ladeBildschirm').innerHTML = "<p class='text-danger'>Fehler beim Laden der Daten.</p>";
    }
}

/**
 * Funktion fǬr markt.html: LǕdt eine Liste von beliebten Aktien
 */
async function initialisiereMarktSeite() {
    // Top Tech Aktien als Standard
    const marktAktien = ['AAPL', 'MSFT', 'TSLA', 'AMZN', 'GOOGL', 'NVDA', 'META', 'NFLX'];
    const tabelleBody = document.getElementById('marktTabelleInhalt');

    // Tabelle leeren (Lade-Hinweis entfernen)
    tabelleBody.innerHTML = '';

    for (const symbol of marktAktien) {
        try {
            // Wir warten hier bewusst auf jeden Call, um das API Rate Limit nicht sofort zu sprengen (Free Tier)
            // In einer Produktion wǬrde man das anders lsen (Backend Caching).
            const quoteResponse = await fetch(`${BASE_URL}/quote?symbol=${symbol}&token=${API_KEY}`);
            const quoteDaten = await quoteResponse.json();

            // Profil kurz fetchen fǬr den Namen (optional, knnte man auch hardcoden fǬr Performance)
            // Um Rate Limits zu sparen, nehmen wir hier erstmal nur das Symbol oder machen einen zweiten Call nur wenn ntig.
            // FǬr dieses Demo-Projekt nutzen wir das Symbol als Name oder holen das Profil, wenn wir langsam machen.
            // Wir machen es einfach: Wir nutzen erst das Symbol. 

            const aenderungProzent = quoteDaten.dp; // dp = percent change

            const zeile = document.createElement('tr');
            zeile.innerHTML = `
                <td class="ps-4 fw-bold">${symbol}</td>
                <td><span class="badge kuerzel-label">${symbol}</span></td>
                <td>$${formatWaehrung(quoteDaten.c)}</td>
                <td>${formatProzent(aenderungProzent)}</td>
                <td class="text-end pe-4">
                    <a href="details.html?symbol=${symbol}" class="btn btn-outline-primary btn-mini">Analyse</a>
                </td>
            `;
            tabelleBody.appendChild(zeile);

        } catch (error) {
            console.error(`Fehler bei ${symbol}:`, error);
        }
    }
}

function marktDatenAktualisieren() {
    const tabelleBody = document.getElementById('marktTabelleInhalt');
    tabelleBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Lade aktuelle Daten...</td></tr>';
    initialisiereMarktSeite();
}
