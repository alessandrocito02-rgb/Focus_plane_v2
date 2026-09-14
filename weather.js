// weather.js
const WEATHER_API_KEY = "fca91f7957a334a0273352e0ef9b0d00"; 

async function getDestinationWeather(lat, lng) {
    // Se non hai ancora messo la chiave, restituisce un avviso
    if (!WEATHER_API_KEY || WEATHER_API_KEY === "fca91f7957a334a0273352e0ef9b0d00") {
        return "Meteo non disponibile (API Key mancante)";
    }
    
    try {
        // Chiama i server meteo passandogli latitudine e longitudine
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric&lang=it`);
        const data = await response.json();
        
        // Estrapola temperatura (arrotondata) e descrizione
        const temp = Math.round(data.main.temp);
        const desc = data.weather[0].description;
        
        // Associa una bella emoji in base al codice meteo
        const iconCode = data.weather[0].icon;
        let emoji = "☁️";
        if(iconCode.includes("01")) emoji = "☀️";
        else if(iconCode.includes("02")) emoji = "⛅";
        else if(iconCode.includes("03") || iconCode.includes("04")) emoji = "☁️";
        else if(iconCode.includes("09") || iconCode.includes("10")) emoji = "🌧️";
        else if(iconCode.includes("11")) emoji = "⛈️";
        else if(iconCode.includes("13")) emoji = "❄️";
        
        // Rende la prima lettera maiuscola per eleganza (es: "Cielo sereno")
        const descCapitalized = desc.charAt(0).toUpperCase() + desc.slice(1);
        
        return `${emoji} ${temp}°C - ${descCapitalized}`;
    } catch (error) {
        console.error("Errore meteo:", error);
        return "📡 Dati meteo fuori portata";
    }
}