module.exports = {
  name: 'daily',
  description: 'Claim your daily coins',
  aliases: ['dailyclaim'],
  role: 0,
  category: 'economy',
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const senderID = event.senderID;

    try {
      const user = await dbHelpers.getUser(senderID);
      if (!user) {
        api.sendMessage({
          body: '╭────❒ Daily ❒\n├⬡ You don\'t have an account.\n╰────────────❒',
          threadID,
        });
        return;
      }

      const dailyReward = 100;                      
      const lastClaim = user.data?.lastDailyClaim;
      const now = new Date();
      const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      if (lastClaim && new Date(lastClaim).toDateString() === now.toDateString()) {
        api.sendMessage({
          body: '// Fixed daily reward
      const lastClaim = user.data?.lastDailyClaim;
      const now = new Date();
      const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));

      if (lastClaim && new Date(lastClaim).toDateString() === now.toDateString()) {
        api.sendMessage({
          body: '╭────❒ Daily ❒\n├⬡ You\'ve already claimed today\'s reward.\n╰────────────❒',
          threadID,
        });
        return;
      }
          // Update user's coins and last claim date
      const userData = user.data || {};
      userData.lastDailyClaim = now.toISOString();
      userData.wallet = (userData.wallet || 0) + dailyReward;

      await dbHelpers.updateUser(senderID, { data: userData });

      api.sendMessage({
        body: `╭────❒ Daily ❒\n├⬡ You claimed ${dailyReward} coins!\n├⬡ Come back tomorrow for more.\n╰────────────❒`,
        threadID,
      });
    } catch (error) {
      console.error('Daily command error:', error);
      api.sendMessage({
        body: '╭────❒ Daily ❒\n├⬡ Error processing claim.\n╰────────────❒',
        threadID,
      });
    }
  },
};

