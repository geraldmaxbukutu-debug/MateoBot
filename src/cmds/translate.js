const axios = require('axios');

const translate = async (text, targetLang = 'en') => {
  try {
    const apiUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await axios.get(apiUrl);
    if (response.data && response.data[0] && response.data[0][0]) {
      return response.data[0][0][0];
    } else {
      return 'Translation failed.';
    }
  } catch (error) {
    console.error('Translation error:', error);
    return 'Translation service error.';
  }
};

module.exports = {
  name: 'translate',
  description: 'Translates replied text to the specified language (default: English).',
  aliases: ['trans'],
  role: 0,
  category: 'utility',
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const messageID = event.messageID;

    const quotedMessage = event.messageReply;
    if (!quotedMessage || !quotedMessage.body) {
      return api.sendMessage({
        body: '╭────❒ 🌐 Translator\n' +
              '├⬡ Reply to a text message to translate it.\n' +
              '├⬡ Usage: !translate [language code (optional)]\n' +
              '├⬡ Example: !translate es (translates to Spanish)\n' +
              '├⬡ Default: Translates to English.\n' +
              '╰───────────────────',
        threadID
      });
    }

    const textToTranslate = quotedMessage.body;
    const targetLanguage = args[0] ? args[0] : 'en';

    try {
      const processingMsg = await api.sendMessage({
        body: `╭────❒ 🌐 Translating\n` +
              `├⬡ Translating to: ${targetLanguage.toUpperCase()}\n` +
              `├⬡ Please wait a moment...\n` +
              `╰───────────────────`,
        threadID
      });

      const translatedText = await translate(textToTranslate, targetLanguage);
      await api.sendMessage({
        body: `🌐 *Translation (${targetLanguage.toUpperCase()}):*\n\n${translatedText}`,
        threadID
      });
      api.unsendMessage(processingMsg.messageID);
    } catch (error) {
      console.error('Translation command error:', error);
      api.unsendMessage(processingMsg.messageID);
      return api.sendMessage({
        body: '❌ Failed to translate the text.',
        threadID
      });
    }
  }
};

