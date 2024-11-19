const { Scenes } = require('telegraf');
const studentController = require('../controllers/studentController');
const botEventController = require('../controllers/botEventController');

const groupScene = new Scenes.BaseScene('group');

// Scene-specific middleware
groupScene.use(async (ctx, next) => {
  if (!ctx.message) return next();
  
  const user = await User.findOne({ 
    where: { telegram_id: ctx.from.id.toString() } 
  });
  ctx.state.user = user;
  return next();
});

// Help command handler
groupScene.command('help', async ctx => {
  const specialCharacters = ['\\', '_', '*', '`', '[', ']', '(', ')']
  const helpText = 
    '*LearningHelper Bot Commands:*\n\n' +
    '**General Commands:**\n\n' +
    '\\- `/help` \\- Display this help message\\.\n\n' +
    // '**Commands for Teachers:**\n\n' +
    // '\\- `/upload` \\- Upload new learning materials and assign an exercise type\\.\n' +
    // '\\- `/register_group` \\- Register a group by forwarding a message from the group to the bot in a private chat\\.\n' +
    // '\\- `/my_groups` \\- View your registered groups\\.\n' +
    // '\\- `/schedule \\[material_id\\] \\[YYYY\-MM\-DD HH:MM\\]` \\- Schedule a material to be sent at a specific time\\.\n' +
    // '\\- `/cancel_schedule \\[task_id\\]` \\- Cancel a scheduled task\\.\n' +
    // '\\- `/list_materials` \\- List all your uploaded materials\\.\n' +
    // '\\- `/delete_material \\[material_id\\]` \\- Delete a material you\'ve uploaded\\.\n' +
    // '\\- `/update_material \\[material_id\\]` \\- Update a material you\'ve uploaded\\.\n\n' +
    // '**Commands for Students:**\n\n' +
    '\\- `/start_quiz` \\- Starts the latest quiz in the group\\.\n' +
    '\\- `/vocab` \\- Begins vocabulary training with the latest materials\\.\n' +
    '\\- `/start_meme_quiz` \\- Starts the latest "Know Your Meme" exercise\\.\n' +
    '\\- `/start_picture_quiz` \\- Starts the latest picture quiz\\.\n' +
    '\\- `/start_world_trivia` \\- Starts the latest world trivia quiz\\.\n' +
    '\\- `/ask` \\- Ask a question during a Q&A session\\.\n\n' +
    '**How to Use the Bot:**\n\n' +
    // '*For Teachers:*\n\n' +
    // '1\\. **Register as a Teacher:**\n' +
    // '  \\- Use the `/start` command to register yourself as a teacher\\.\n\n' +
    // '2\\. **Register a Group:**\n' +
    // '  \\- Add the bot to your group\\.\n' +
    // '  \\- In the group, select any message and forward it to the bot in a private chat\\.\n' +
    // '  \\- The bot will extract the group information and register it\\.\n' +
    // '  \\- Ensure you are an admin of the group\\.\n\n' +
    // '3\\. **Upload Materials:**\n' +
    // '  \\- Use the `/upload` command in a private chat with the bot\\.\n' +
    // '  \\- Select an exercise type from the provided options\\.\n' +
    // '  \\- Follow the prompts to send the required content\\.\n\n' +
    // '4\\. **Schedule Materials:**\n' +
    // '  \\- Use the `/schedule` command to schedule materials to be sent to your groups\\.\n' +
    // '  \\- Example: `/schedule \\[material_id\\] \\[YYYY\-MM\-DD HH:MM\\]`\\.\n' +
    // '  \\- Use `/list_materials` to get the IDs of your materials\\.\n\n' +
    // '5\\. **Manage Materials:**\n' +
    // '  \\- Use `/list_materials` to view your uploaded materials\\.\n' +
    // '  \\- Use `/delete_material \\[material_id\\]` to delete a material\\.\n' +
    // '  \\- Use `/update_material \\[material_id\\]` to update a material\\.\n\n' +
    // '*For Students:*\n\n' +
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


const groupController = {
  startVocabularyTraining: studentController.startVocabularyTraining,
  startQuiz: studentController.startQuiz,
  startMemeQuiz: studentController.startMemeQuiz,
  startPictureQuiz: studentController.startPictureQuiz,
  startWorldTrivia: studentController.startWorldTrivia,
  askQuestion: studentController.handleStudentQuestion
}

// Group-specific commands
groupScene.command('vocab', groupController.startVocabularyTraining);
groupScene.command('start_quiz', groupController.startQuiz);
groupScene.command('start_meme_quiz', groupController.startMemeQuiz);
groupScene.command('start_picture_quiz', groupController.startPictureQuiz);
groupScene.command('start_world_trivia', groupController.startWorldTrivia);
groupScene.command('ask', groupController.askQuestion);

// Handle mentions
groupScene.on('text', async (ctx) => {
  const hasMention = ctx.message.entities?.some(entity => 
    entity.type === 'mention' && 
    ctx.message.text.substring(entity.offset, entity.offset + entity.length) === '@' + ctx.botInfo.username
  );

  if (hasMention) {
    await botEventController.handleMention(ctx);
  }
});

module.exports = { groupScene }; 