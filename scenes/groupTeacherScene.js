const { Scenes, Telegraf } = require('telegraf');
const teacherController = require('../controllers/teacherController');
const botEventController = require('../controllers/botEventController');

const groupTeacherScene = new Scenes.BaseScene('groupTeacher');


// Scene enter handler
groupTeacherScene.enter(async (ctx) => {
  await ctx.reply(
    '👋Group teacher scene' +
    'Use /help to see available commands.'
  );
});

// Help command handler
groupTeacherScene.command('help', async (ctx) => {
  await ctx.reply(
    '*Teacher Group Commands:*\n\n' +
    '📚 *Exercise Management*\n' +
    '/start_exercise - Start a new exercise\n' +
    '/end_exercise - End current exercise\n' +
    '/stats - View group statistics\n\n' +
    '👥 *Group Management*\n' +
    '/announce - Make an announcement\n' +
    '/settings - Group settings',
    { parse_mode: 'Markdown' }
  );
});

// Teacher group commands
// groupTeacherScene.command('start_exercise', teacherController.handleStartExercise);
// groupTeacherScene.command('end_exercise', teacherController.handleEndExercise);
// groupTeacherScene.command('stats', teacherController.handleGroupStats);
// groupTeacherScene.command('announce', teacherController.makeAnnouncement);
// groupTeacherScene.command('settings', teacherController.groupSettings);
groupTeacherScene.command('start_quiz', teacherController.startQuiz);
groupTeacherScene.command('meme_quiz', teacherController.startMemeQuiz);
groupTeacherScene.command('picture_quiz', teacherController.startPictureQuiz);


// // Handle mentions
// groupTeacherScene.on('text', async (ctx) => {
//   const hasMention = ctx.message.entities?.some(entity => 
//     entity.type === 'mention' && 
//     ctx.message.text.substring(entity.offset, entity.offset + entity.length) === '@' + ctx.botInfo.username
//   );

//   if (hasMention) {
//     await teacherController.handleGroupMessage(ctx);
//   }
// });
// Add these updated handlers instead
groupTeacherScene.use(Telegraf.chatType(['group', 'supergroup'], async (ctx, next) => {
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

module.exports = { groupTeacherScene }; 