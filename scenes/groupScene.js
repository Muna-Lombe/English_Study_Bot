const { Scenes, Telegraf } = require('telegraf');
const studentController = require('../controllers/studentController');
const botEventController = require('../controllers/botEventController');
const { User, Group } = require('../models');

const groupScene = new Scenes.BaseScene('group');

// Scene enter handler
groupScene.enter(async (ctx) => {
  await ctx.reply(
    'group scene' +
    'Use /help to see available commands.'
  );
});


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
    // '\\- `/sta/rt_quiz` \\- Starts the latest quiz in the group\\.\n' +
    // '\\- `/vocab` \\- Begins vocabulary training with the latest materials\\.\n' +
    // '\\- `/start_me/me_quiz` \\- Starts the latest "Know Your Meme" exercise\\.\n' +
    // '\\- `/start_pi/cture_quiz` \\- Starts the latest picture quiz\\.\n' +
    // '\\- `/start_wo/rld_trivia` \\- Starts the latest world trivia quiz\\.\n' +
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
    '**Note:** Use `@LearningHelperBot` when mentioning or messaging\\.\n\n' +
    '**Examples:**\n\n' +
    '\\- Starting a quiz: `/start_quiz`\\.\n' +
    '\\- Asking a question: `/ask How does photosynthesis work?`\\.\n\n' +
    '*Need further assistance?* Feel free to reach out to your teacher or contact the bot developer\\.\n\n' +
    '*Happy learning\\!*'

  await ctx.replyWithMarkdownV2(helpText)
})


// const groupController = {
//   startVocabularyTraining:(ctx) => {
//     if (ctx.state.user.role === 'student') {
//       studentController.startVocabularyTraining(ctx)
//     } else {
//       ctx.reply("You are not a student")
//     }
//   },
//   startQuiz:(ctx) => {
//     if (ctx.state.user.role === 'student') {
//       studentController.startQuiz(ctx)
//     } else {
//       ctx.reply("You are not a student")
//     }
//   },
//   startMemeQuiz:(ctx) => {
//     if (ctx.state.user.role === 'student') {
//       studentController.startMemeQuiz(ctx)
//     } else {
//       ctx.reply("You are not a student")
//     }
//   },
//   startPictureQuiz:(ctx) => {
//     if (ctx.state.user.role === 'student') {
//       studentController.startPictureQuiz(ctx)
//     } else {
//       ctx.reply("You are not a student")
//     }
//   },
//   startWorldTrivia:(ctx) => {
//     if (ctx.state.user.role === 'student') {
//       studentController.startWorldTrivia(ctx)
//     } else {
//       ctx.reply("You are not a student")
//     }
//   },
//   askQuestion:(ctx) => {
//     if (ctx.state.user.role === 'student') {
//       studentController.handleStudentQuestion(ctx)
//     } else {
//       ctx.reply("You are not a student")
//     }
//   }
// }

// Group-specific commands
// groupScene.command('vocab', groupController.startVocabularyTraining);
// groupScene.command('start_quiz', groupController.startQuiz);
// groupScene.command('start_meme_quiz', groupController.startMemeQuiz);
// groupScene.command('start_picture_quiz', groupController.startPictureQuiz);
// groupScene.command('start_world_trivia', groupController.startWorldTrivia);
// groupScene.command('ask', groupController.askQuestion);


// Add these updated handlers instead

groupScene.use(Telegraf.chatType(['group', 'supergroup'], async (ctx, next) => {
  const user = (await User.findOne({ 
    where: { telegram_id: ctx.from?.id?.toString() } 
  })) || (await User.findOne({ 
    where: { telegram_id: ctx.update?.inline_query?.from?.id?.toString() } 
  }));
  const registeredGroup = await Group.findOne({ where: { chat_id: ctx.chat?.id.toString() } });
  // If chat type is supergroup and group does not exist, do not enter any scene
  if(!registeredGroup){
    // check if the stage is registering a group
    
    console.log(`Group ${ctx.chat.id} not found, leaving`);
    await ctx.reply('Group not found, please contact your teacher to register this group.');
    // await ctx.telegram.leaveChat(ctx.chat.id);
    return next();
  }
  
  // check if user is registered
  if(!user){
    // check if the user is an admin of the group but not a bot
    const isAdmin = ctx.chat.admins.some(admin => admin.user.id === ctx.from.id && admin.user.id !== ctx.botInfo.id);
    if(isAdmin){
      user = await User.upsert({
        telegram_id: ctx.from.id.toString(),
        name: ctx.from.first_name + ' ' + ctx.from.last_name,
        role: 'teacher',
        student_group_ids: []
      });
    }else{
      // add the user as a student to the group
      user = await User.upsert({
        telegram_id: ctx.from.id.toString(),
        name: ctx.from.first_name + ' ' + ctx.from.last_name,
        role: 'student',
        student_group_ids: [ctx.chat.id.toString()]
      });
    }
  }

  // If user is a student, check if they are already in the group
  if(user.role === 'student'){
    console.log("SCENE: group student scene");
    // Check if user is a student and already exists
    const studentInGroup = user.student_group_ids.includes(ctx.chat.id.toString());
    if(!studentInGroup){
      user = await User.upsert({
        telegram_id: ctx.from.id.toString(),
        student_group_ids: [...user.student_group_ids, ctx.chat.id.toString()]
      });
    } else {
      user.student_group_ids.push(ctx.chat.id.toString());
      await user.save();
    }
    return await ctx.scene.enter('groupStudent');
  } else if (user.role === 'teacher') {
    console.log("SCENE: group teacher scene");
    return await ctx.scene.enter('groupTeacher');
  } 

  // Handle group-specific updates
  console.log("group",ctx)
  if (ctx.message?.new_chat_members) {
    // handle bot was added to group
    const newBotMember = ctx.message.new_chat_members.find(
      member => member.id === ctx.botInfo.id
    );
    if (newBotMember) {
      await botEventController.handleBotJoin(ctx);
      return next();
    }

    // handle student was added to group
    const newStudentMember = ctx.message.new_chat_members.find(
      member => member.id !== ctx.botInfo.id
    );
    if (newStudentMember) {
      await botEventController.handleStudentJoin(ctx);
      return next();
    }

    // handle student left group
    const leftStudentMember = ctx.message.left_chat_members.find(
      member => member.id !== ctx.botInfo.id && //student is not the bot
        !ctx.chat.admins.some(admin => admin.user.id === member.id) //student is not an admin of the group
    );
    if (leftStudentMember) {
      await botEventController.handleStudentLeave(ctx);
      return next();
    }

    // handle student was banned from group
    const bannedStudentMember = ctx.message.left_chat_members.find(
      member => member.id !== ctx.botInfo.id
    );
    if (bannedStudentMember) {
      await botEventController.handleStudentBan(ctx);
      return next();
    }

    // handle student was unbanned from group
    const unbannedStudentMember = ctx.message.left_chat_members.find(
      member => member.id !== ctx.botInfo.id
    );
    if (unbannedStudentMember) {
      await botEventController.handleStudentUnban(ctx);
      return next();
    }

    // handle teacher joined group
    const newTeacherMember = ctx.message.new_chat_members.find(
      member => member.id !== ctx.botInfo.id && //teacher is not the bot
        ctx.chat.admins.some(admin => admin.user.id === member.id) //teacher is an admin of the group
    );
    if (newTeacherMember) {
      await botEventController.handleTeacherJoin(ctx);
      return next();
    }

    // handle teacher left group
    const leftTeacherMember = ctx.message.left_chat_members.find(
      member => member.id === ctx.from.id
    );
    if (leftTeacherMember) {
      await botEventController.handleTeacherLeave(ctx);
      return next();
    }

    // handle bot left group
    const leftBotMember = ctx.message.left_chat_members.find(
      member => member.id === ctx.botInfo.id
    );
    if (leftBotMember) {
      await botEventController.handleBotLeave(ctx);
      return next();
    }
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
      return next();
    }

    // Check for replies to bot
    if (ctx.message.reply_to_message?.from?.id === ctx.botInfo.id) {
      await botEventController.handleReply(ctx);
      return next();
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


// // Handle mentions
// groupScene.on('text', async (ctx) => {
//   const hasMention = ctx.message.entities?.some(entity => 
//     entity.type === 'mention' && 
//     ctx.message.text.substring(entity.offset, entity.offset + entity.length) === '@' + ctx.botInfo.username
//   );

//   if (hasMention) {
//     await botEventController.handleMention(ctx);
//   }
// });

module.exports = { groupScene }; 