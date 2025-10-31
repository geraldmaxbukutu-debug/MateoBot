const { createCanvas } = require('canvas');

module.exports = {
  name: 'bank',
  description: 'Manage coins',
  aliases: ['money'],
  role: 0,
  category: 'Economy',
  cooldown: 5,
  execute: async (api, event, args, dbHelpers, settings, getText) => {
    const threadID = event.threadID;
    const senderID = event.senderID;
    const transferFeeRate = 0.05;

    try {
      const user = await dbHelpers.getUser(senderID);
      if (!user) {
        api.sendMessage({ body: '╭────❒ Bank ❒\n├⬡ No account\n╰────────────❒', threadID });
        return;
      }

      if (!args[0]) {
        api.sendMessage({ body: '╭────❒ Bank ❒\n├⬡ Usage: bank <balance|deposit|withdraw|transfer>\n╰────────────❒', threadID });
        return;
      }

      switch (args[0].toLowerCase()) {
        case 'balance':
          const balance = user.data?.bank || 0;
          api.sendMessage({ body: `╭────❒ Balance ❒\n├⬡ ${balance} coins\n╰────────────❒`, threadID });
          break;
        case 'transfer':
          if (!event.mentions || Object.keys(event.mentions).length === 0) {
            api.sendMessage({ body: '╭────❒ Transfer ❒\n├⬡ Mention user\n╰────────────❒', threadID });
            return;
          }
          const targetID = Object.keys(event.mentions)[0];
          if (!args[1] || isNaN(args[1])) {
            api.sendMessage({ body: '╭────❒ Transfer ❒\n├⬡ Specify amount\n╰────────────❒', threadID });
            return;
          }
          const transferAmount = parseInt(args[1]);
          if (transferAmount <= 0) {
            api.sendMessage({ body: '╭────❒ Transfer ❒\n├⬡ Invalid amount\n╰────────────❒', threadID });
            return;
          }
          const senderBankBalance = user.data?.bank || 0;
          const transferFee = Math.floor(transferAmount * transferFeeRate);
          const totalDeduct = transferAmount + transferFee;
          if (senderBankBalance < totalDeduct) {
            api.sendMessage({ body: `╭────❒ Transfer ❒\n├⬡ Insufficient balance. Fee: ${transferFee}\n╰────────────❒`, threadID });
            return;
          }

          const targetUser = await dbHelpers.getUser(targetID);
          if (!targetUser) {
            api.sendMessage({ body: '╭────❒ Transfer ❒\n├⬡ Target user has no account\n╰────────────❒', threadID });
            return;
          }

          // Update balances
          const senderData = user.data || {};
          senderData.bank -= totalDeduct;
          await dbHelpers.updateUser(senderID, { data: senderData });
          const targetData = targetUser.data || {};
          targetData.bank = (targetData.bank || 0) + transferAmount;
          await dbHelpers.updateUser(targetID, { data: targetData });

          // Generate receipt
          const receiptBuffer = await generateReceipt({
            type: 'Transfer',
            sender: senderID,
            receiver: targetID,
            amount: transferAmount,
            fee: transferFee,
          });

          // Send notifications with receipt
          api.sendMessage({ body: 'Transaction receipt', attachment: receiptBuffer }, threadID);
          api.sendMessage({ body: `╭────❒ Transfer ❒\n├⬡ Debited: ${totalDeduct}\n├⬡ To: ${event.mentions[targetID]}\n╰────────────❒`, threadID }, senderID);
          api.sendMessage({ body: `╭────❒ Transfer ❒\n├⬡ Credited: ${transferAmount}\n├⬡ From: ${senderID}\n╰────────────❒`, threadID }, targetID);
          break;
        // Other cases...
      }
    } catch (error) {
      console.error('Bank error:', error);
      api.sendMessage({ body: '╭────❒ Bank ❒\n├⬡ Error\n╰────────────❒', threadID });
    }
  },
};

async function generateReceipt(details) {
  const canvas = createCanvas(400, 600);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, 400, 600);

  ctx.fillStyle = '#333';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Transaction Receipt', 200, 30);

  ctx.font = '18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`Type: ${details.type}`, 20, 70);
  ctx.fillText(`From: ${details.sender}`, 20, 100);
  ctx.fillText(`To: ${details.receiver}`, 20, 130);
  ctx.fillText(`Amount: ${details.amount} coins`, 20, 160);
  ctx.fillText(`Fee: ${details.fee} coins`, 20, 190);

  ctx.fillStyle = '#555';
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Processed by Gerald Ai', 200, 580);

  return canvas.toBuffer();
}

