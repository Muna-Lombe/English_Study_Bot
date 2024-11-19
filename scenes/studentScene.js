const { Scenes } = require('telegraf');
const studentController = require('../controllers/studentController');

const studentScene = new Scenes.BaseScene('student');

studentScene.enter(async (ctx) => {
  await ctx.reply('Student mode activated. Use /help to see available commands.');
});

// Help command handler
studentScene.command('help', async ctx => {
  const specialCharacters = ['\\', '_', '*', '`', '[', ']', '(', ')']
  const helpText = 
    '*LearningHelper Bot Commands:*\n\n' +
    '**General Commands:**\n\n' +
    '\\- `/start` \\- Start interacting with the bot and select your role\\.\n' +
    '\\- `/help` \\- Display this help message\\.\n\n' +
    '**Commands for Students:**\n\n' +
    '\\- `/start_quiz` \\- Starts the latest quiz in the group\\.\n' +
    '\\- `/vocab` \\- Begins vocabulary training with the latest materials\\.\n' +
    '\\- `/start_meme_quiz` \\- Starts the latest "Know Your Meme" exercise\\.\n' +
    '\\- `/start_picture_quiz` \\- Starts the latest picture quiz\\.\n' +
    '\\- `/start_world_trivia` \\- Starts the latest world trivia quiz\\.\n' +
    '\\- `/ask` \\- Ask a question during a Q&A session\\.\n\n' +
    '**How to Use the Bot:**\n\n' +
    '1\\. **Participate in Exercises:**\n' +
    '  \\- Use the exercise commands in the group to start activities\\.\n' +
    '  \\- Example: `/start_quiz`, `/vocab`, `/start_meme_quiz`\\.\n\n' +
    '2\\. **Ask Questions:**\n' +
    '  \\- During a Q&A session, use the `/ask` command followed by your question\\.\n' +
    '  \\- Example: `/ask What is the capital of France?`\\.\n\n' +
    '**Note:** Replace `@LearningHelperBot` with the bot\'s actual username when mentioning or messaging\\.\n\n' +
    '**Examples:**\n\n' +
    '\\- Starting a quiz: `/start_quiz`\\.\n' +
    '\\- Asking a question: `/ask How does photosynthesis work?`\\.\n\n' +
    '*Need further assistance?* Feel free to reach out to your teacher or contact the bot developer\\.\n\n' +
    '*Happy learning\\!*'

  await ctx.replyWithMarkdownV2(helpText)
})



// Student commands
studentScene.command('vocab', studentController.startVocabularyTraining)
studentScene.command('start_quiz', studentController.startQuiz)
studentScene.command('start_meme_quiz', studentController.startMemeQuiz)
studentScene.command('start_picture_quiz', studentController.startPictureQuiz)
// Add more student-specific handlers


module.exports = { studentScene}; 