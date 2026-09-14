// weather.js - Modulo Meteo con Timeout e Fallback Garantito

const WEATHER_API_KEY = "fca91f7957a334a0273352e0ef9b0d00";

async function getDestinationWeather(lat, lng) {
    // Controller per annullare la richiesta se ci mette più di 3 secondi
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    if (WEATHER_API_KEY && WEATHER_API_KEY !== "INSERISCI_QUI_LA_TUA_CHIAVE") {
        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric&lang=it`,
                { signal: controller.signal }
            );
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                const temp = Math.round(data.main.temp);
                const desc = data.weather[0].description;
                const iconCode = data.weather[0].icon;

                let emoji = "☁️";
                if (iconCode.includes("01")) emoji = "☀️";
                else if (iconCode.includes("02")) emoji = "⛅";
                else if (iconCode.includes("03") || iconCode.includes("04")) emoji = "☁️";
                else if (iconCode.includes("09") || iconCode.includes("10")) emoji = "🌧️";
                else if (iconCode.includes("11")) emoji = "⛈️";
                else if (iconCode.includes("13")) emoji = "❄️";

                const descCapitalized = desc.charAt(0).toUpperCase() + desc.slice(1);
                return `${emoji} ${temp}°C - ${descCapitalized}`;
            }
        } catch (error) {
            console.warn("[Weather Module] Chiamata fallita o timeout, attivo meteo di riserva.");
        }
    }

    // METEO DI RISERVA AUTOMATICO (Garantito se l'API non risponde)
    let approxTemp = Math.round(25 - Math.abs(lat) * 0.3);
    let condition = "☀️ Soleggiato";
    if (Math.abs(lat) > 50) condition = "🌥️ Nuvoloso e fresco";
    if (Math.abs(lat) < 15) condition = "🌴 Caldo tropicale";

    return `${condition} ~${approxTemp}°C`;
}
