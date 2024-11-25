const { Scenes } = require('telegraf');
const studentController = require('../controllers/studentController');

const privateStudentScene = new Scenes.BaseScene('privateStudent');

// Scene enter handler
privateStudentScene.enter(async (ctx) => {
  await ctx.reply(
    '👋 Welcome student!\n' +
    'Use /help to see available commands.'
  );
});

// Help command handler
privateStudentScene.command('help', async (ctx) => {
  await ctx.reply(
    '*Student Commands:*\n\n' +
    '📚 *Learning*\n' +
    // '/join_group - Join a study group\n' +
    '/my_progress - View your progress\n' +
    '/practice - Start practice session\n\n' +
    '/vocab - Start vocabulary training\n\n' +
    'Use @LearnerBot to ask questions\n\n' +
    '❓ *Support*\n' +
    '/ask - Ask a question\n' +
    '/feedback - Send feedback',
    { parse_mode: 'Markdown' }
  );
});

// Student-specific commands
// privateStudentScene.command('join_group', studentController.joinGroup);
// privateStudentScene.command('feedback', studentController.sendFeedback);
privateStudentScene.command('my_progress', studentController.viewProgress);
privateStudentScene.command('start_quiz', studentController.startQuiz);
privateStudentScene.command('meme_quiz', studentController.startMemeQuiz);
privateStudentScene.command('picture_quiz', studentController.startPictureQuiz);
privateStudentScene.command('practice', studentController.startPractice);
privateStudentScene.command('vocab', studentController.startVocabularyTraining);
privateStudentScene.command('ask', studentController.askQuestion);


// handle private mentions
privateStudentScene.on('text', async (ctx) => {
  const hasMention = ctx.message.entities?.some(entity => 
    entity.type === 'mention' && 
    ctx.message.text.substring(entity.offset, entity.offset + entity.length) === '@' + ctx.botInfo.username
  );

  if (hasMention) {
    await studentController.handleStudentQuestion(ctx);
  }
});

module.exports = { privateStudentScene }; 