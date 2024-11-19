const { Scenes } = require('telegraf');
const teacherController = require('../controllers/teacherController');
const studentController = require('../controllers/studentController');

const teacherScene = new Scenes.BaseScene('teacher');

teacherScene.enter(async (ctx) => {
  await ctx.reply('Teacher mode activated. Use /help to see available commands.');
});

// Help command handler
teacherScene.command('help', async ctx => {
  const specialCharacters = ['\\', '_', '*', '`', '[', ']', '(', ')']
  const helpText = 
    '*LearningHelper Bot Commands:*\n\n' +
    '**General Commands:**\n\n' +
    '\\- `/start` \\- Start interacting with the bot and select your role\\.\n' +
    '\\- `/help` \\- Display this help message\\.\n\n' +
    '\\- `/upload` \\- Upload new learning materials and assign an exercise type\\.\n' +
    '\\- `/register_group` \\- Register a group by forwarding a message from the group to the bot in a private chat\\.\n' +
    '\\- `/my_groups` \\- View your registered groups\\.\n' +
    '\\- `/schedule \\[material_id\\] \\[YYYY\-MM\-DD HH:MM\\]` \\- Schedule a material to be sent at a specific time\\.\n' +
    '\\- `/cancel_schedule \\[task_id\\]` \\- Cancel a scheduled task\\.\n' +
    '\\- `/list_materials` \\- List all your uploaded materials\\.\n' +
    '\\- `/delete_material \\[material_id\\]` \\- Delete a material you\'ve uploaded\\.\n' +
    '\\- `/update_material \\[material_id\\]` \\- Update a material you\'ve uploaded\\.\n\n' +
    '**How to Use the Bot:**\n\n' +
    '1\\. **Register as a Teacher:**\n' +
    '  \\- Use the `/start` command to register yourself as a teacher\\.\n\n' +
    '2\\. **Register a Group:**\n' +
    '  \\- Add the bot to your group\\.\n' +
    '  \\- In the group, select any message and forward it to the bot in a private chat\\.\n' +
    '  \\- The bot will extract the group information and register it\\.\n' +
    '  \\- Ensure you are an admin of the group\\.\n\n' +
    '3\\. **Upload Materials:**\n' +
    '  \\- Use the `/upload` command in a private chat with the bot\\.\n' +
    '  \\- Select an exercise type from the provided options\\.\n' +
    '  \\- Follow the prompts to send the required content\\.\n\n' +
    '4\\. **Schedule Materials:**\n' +
    '  \\- Use the `/schedule` command to schedule materials to be sent to your groups\\.\n' +
    '  \\- Example: `/schedule \\[material_id\\] \\[YYYY\-MM\-DD HH:MM\\]`\\.\n' +
    '  \\- Use `/list_materials` to get the IDs of your materials\\.\n\n' +
    '5\\. **Manage Materials:**\n' +
    '  \\- Use `/list_materials` to view your uploaded materials\\.\n' +
    '  \\- Use `/delete_material \\[material_id\\]` to delete a material\\.\n' +
    '  \\- Use `/update_material \\[material_id\\]` to update a material\\.\n\n' +
    '**Note:** Replace `@LearningHelperBot` with the bot\'s actual username when mentioning or messaging\\.\n\n' +
    '**Examples:**\n\n' +
    '\\- Starting a quiz: `/start_quiz`\\.\n' +
    '\\- Asking a question: `/ask How does photosynthesis work?`\\.\n\n' +
    '*Need further assistance?* Feel free to reach out to your teacher or contact the bot developer\\.\n\n' +
    '*Happy learning\\!*'

  await ctx.replyWithMarkdownV2(helpText)
})


// Teacher commands
teacherScene.command('vocab', studentController.startVocabularyTraining)
teacherScene.command('start_quiz', studentController.startQuiz)
teacherScene.command('start_meme_quiz', studentController.startMemeQuiz)
teacherScene.command('start_picture_quiz', studentController.startPictureQuiz)
teacherScene.command('create_quiz', async (ctx) => {
  ctx.reply('Quiz creation mode coming soon...')
  // ctx.scene.enter('quiz_creation');
});
// Add more teacher-specific handlers

module.exports = { teacherScene }; 