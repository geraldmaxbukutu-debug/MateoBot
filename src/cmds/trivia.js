const axios = require('axios');

module.exports = {
  name: "trivia",
  description: "Play a trivia game",
  role: 0,
  category: "media",
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const senderID = event.senderID;

    try {
      const response = await axios.get('https://opentdb.com/api.php?amount=1');
      const questionData = response.data.results[0];
      const question = decodeURIComponent(questionData.question);
      const correctAnswer = questionData.correct_answer;
      const options = [...questionData.incorrect_answers, correctAnswer];
      const shuffledOptions = shuffleArray(options);

      let message = `Category: ${questionData.category}\n`;
      message += `Difficulty: ${questionData.difficulty}\n`;
      message += `Question: ${question}\n`;
      message += `Options:\n`;
      shuffledOptions.forEach((option, index) => {
        message += `${String.fromCharCode(65 + index)}. ${option}\n`;
      });
      message += 'Reply with A, B, C, or D to answer.';

      api.sendMessage(message, threadID);

                                 
      dbHelpers.setUserState(senderID, { waitingFor: 'triviaAnswer', correctAnswer: correctAnswer, options: shuffledOptions });
    } catch (error) {
      api.sendMessage('Error fetching trivia.', threadID);
    }
  },
};
  // Helper function to handle user's response
async function handleTriviaResponse(api, event, dbHelpers, settings) {
  const senderID = event.senderID;
  const threadID = event.threadID;
  const userState = await dbHelpers.getUserState(senderID);

  if (userState && userState.waitingFor === 'triviaAnswer') {
    const answer = event.body.trim().toUpperCase();
    const options = userState.options;
    const correctAnswer = userState.correctAnswer;

    if (['A', 'B', 'C', 'D'].includes(answer) && answer.length === 1) {
      const selectedIndex = answer.charCodeAt(0) - 65;
      const selectedAnswer = options[selectedIndex];

      if (selectedAnswer === correctAnswer) {
        api.sendMessage('Correct!', threadID);
      } else {
        api.sendMessage(`Wrong! The correct answer was ${correctAnswer}.`, threadID);
      }
    } else {
      api.sendMessage('Invalid response. Please reply with A, B, C, or D.', threadID);
    }

    dbHelpers.clearUserState(senderID);
  }
}

// Helper function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
  