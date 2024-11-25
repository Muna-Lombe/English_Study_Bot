const { Scenes, Telegraf } = require('telegraf');
const studentController = require('../controllers/studentController');
const botEventController = require('../controllers/botEventController');

const groupStudentScene = new Scenes.BaseScene('groupStudent');

// Help command handler
groupStudentScene.command('help', async (ctx) => {
  await ctx.reply(
    '*Student Group Commands:*\n\n' +
    // '📚 *Exercises*\n' +
    // '/start_quiz - Start a quiz\n' +
    // '/vocab - Practice vocabulary\n' +
    // '/meme_quiz - Start meme quiz\n' +
    // '/picture_quiz - Start picture quiz\n\n' +
    '❓ *Questions*\n' +
    '/ask - Ask a question',
    { parse_mode: 'Markdown' }
  );
});

// Student group commands
groupStudentScene.command('ask', studentController.handleStudentQuestion);

// // Handle mentions
// groupStudentScene.on('text', async (ctx) => {
//   const hasMention = ctx.message.entities?.some(entity => 
//     entity.type === 'mention' && 
//     ctx.message.text.substring(entity.offset, entity.offset + entity.length) === '@' + ctx.botInfo.username
//   );

//   if (hasMention) {
//     await studentController.handleGroupMessage(ctx);
//   }
// });

// Add these updated handlers instead
groupStudentScene.use(Telegraf.chatType(['group', 'supergroup'], async (ctx, next) => {
  // Handle group-specific updates
  console.log("group",ctx)
  if (ctx.message?.new_chat_members) {
    const newBotMember = ctx.message.new_chat_members.find(
      member => member.id === ctx.botInfo.id
    );
    if (newBotMember) {
      await botEventController.handleBotJoin(ctx);
    }
  } else if (ctx.message?.left_chat_member?.id === ctx.botInfo.id) {
    await botEventController.handleBotLeave(ctx);
  }

  // Handle text messages (including mentions and replies)
  if (ctx.message.text) {
    // Check for mentions
    const hasMention = ctx.message.entities?.some(entity => 
      entity.type === 'mention' && 
      ctx.message.text.substring(entity.offset, entity.offset + entity.length) === '@' + ctx.botInfo.username
    );

    if (hasMention) {
      await botEventController.handleMention(ctx);
      return;
    }

    // Check for replies to bot
    if (ctx.message.reply_to_message?.from?.id === ctx.botInfo.id) {
      await botEventController.handleReply(ctx);
      return;
    }

    // Handle other text messages in group
    await botEventController.handleText(ctx);
  }

  // Handle media messages if needed
  if (ctx.message.photo || ctx.message.video || ctx.message.document) {
    await botEventController.handleMedia(ctx);
  }
  return next();
}));


module.exports = { groupStudentScene }; 