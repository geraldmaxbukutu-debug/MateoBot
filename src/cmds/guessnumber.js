module.exports = {
  name: "guessnumber",
  description: "Play a number guessing game between 1 and 100",
  role: 0,
  category: "fun",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText, onChat) => {
    const threadID = event.threadID;
    const targetNumber = Math.floor(Math.random() * 100) + 1;
    let attempts = 0;

    const handler = async (api, event) => {
      if (event.threadID !== threadID) return;
      attempts++;
      const guess = parseInt(event.body);
      if (event.body.toLowerCase() === 'stop') {
        api.sendMessage(`Game stopped. The number was ${targetNumber}.`, threadID);
        onChat(null); // Remove handler
      } else if (isNaN(guess)) {
        api.sendMessage('Please enter a valid number or type "stop" to quit.', threadID);
      } else if (guess < targetNumber) {
        api.sendMessage('Too low! Try again.', threadID);
      } else if (guess > targetNumber) {
        api.sendMessage('Too high! Try again.', threadID);
      } else {
        api.sendMessage(`Congratulations! You guessed ${targetNumber} in ${attempts} attempts.`, threadID);
        onChat(null); // Remove handler
      }
    };

    onChat(handler);
    api.sendMessage('Guess a number between 1 and 100. Type "stop" to quit.', threadID);
  },
};

