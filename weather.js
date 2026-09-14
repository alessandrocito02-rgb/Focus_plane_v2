// weather.js - Modulo Meteo con Fallback Automatico

const WEATHER_API_KEY = "fca91f7957a334a0273352e0ef9b0d00";

async function getDestinationWeather(lat, lng) {
    if (WEATHER_API_KEY && WEATHER_API_KEY !== "8e4948f2af709a04949fd4cb8efa568a") {
        try {
            const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric&lang=it`);
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
            console.warn("[Weather Module] Errore API, attivazione meteo stimato di riserva.");
        }
    }

    // METEO DI RISERVA AUTOMATICO (Fallback basato sulla latitudine)
    let approxTemp = Math.round(25 - Math.abs(lat) * 0.3);
    let condition = "☀️ Soleggiato";
    if (Math.abs(lat) > 50) condition = "🌥️ Nuvoloso e fresco";
    if (Math.abs(lat) < 15) condition = "🌴 Caldo tropicale";

    return `${condition} ~${approxTemp}°C (Stimato)`;
}
