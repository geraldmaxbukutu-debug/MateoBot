module.exports = {
  name: 'spy',
  description: 'Retrieves some public information about a tagged or replied-to user.',
  aliases: ['userinfo', 'profileinfo'],
  role: 0,
  category: 'info',
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const senderID = event.senderID;

    let targetID;
    if (event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (event.mentions && Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else {
      targetID = senderID;
    }

    if (!targetID) {
      return api.sendMessage({
        body: '╭────❒ 👤 Info ❒\n├⬡ Please tag or reply to a user to get their public information.\n╰────────────❒',
        threadID
      });
    }

    try {
      const processingMsg = await api.sendMessage({
        body: '╭────❒ ⏳ Fetching ❒\n├⬡ Retrieving public information...\n╰────────────❒',
        threadID
      });

      const userInfo = await api.getUserInfo(targetID);
      const user = userInfo[targetID];
      const name = user.name || 'N/A';
      const profileUrl = user.profileUrl || null; // Check if profile URL is available
      let adminStatus = 'No';
      if (event.isGroup && settings.adminIDs.includes(targetID)) {
        adminStatus = 'Yes';
      }

      let message = `╭────❒ 👤 Public User Info 👤 ❒────\n` +
                    `├⬡ Name: ${name}\n` +
                    `├⬡ ID: ${targetID}\n` +
                    `├⬡ Admin in this group: ${adminStatus}\n`;

      if (profileUrl) {
        message += ``;
      }

      message += `╰────────────❒`;

      const pic = axios.get(profileUrl, { responseType: 'arrayBuffer' });
      profileBuffer = Buffer.from(pic.data, 'binary')
      
      await api.sendMessage({
        body: message,
        attachment: fs.createWriteStream('./cache/pfp-' + Date.now + '-' + targetID).write(profileBuffer);
        threadID
      });
      api.unsendMessage(processingMsg.messageID);
    } catch (error) {
      console.error('Error fetching user info:', error);
      api.unsendMessage(processingMsg.messageID);
      api.sendMessage({
        body: '╭────❒ ❌ Error ❒\n├⬡ Could not retrieve public information for this user.\n╰────────────❒',
        threadID
      });
    }
  }
};

