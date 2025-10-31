const axios = require('axios');
const apiKey = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with your API key

module.exports = {
  name: "weather",
  description: "Get weather information",
  role: 0,
  category: "utility",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const city = args.join(' ');

    if (!city) {
      return api.sendMessage('Please provide a city name.', threadID);
    }

    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
      const data = response.data;
      let message = `**${data.name}, ${data.sys.country}**\n`;
      message += `Temperature: ${data.main.temp}°C\n`;
      message += `Condition: ${data.weather[0].description}\n`;
      message += `Humidity: ${data.main.humidity}%\n`;
      message += `Wind Speed: ${data.wind.speed} m/s`;
      api.sendMessage(message, threadID);
    } catch (error) {
      api.sendMessage('City not found or error fetching weather.', threadID);
    }
  },
};

