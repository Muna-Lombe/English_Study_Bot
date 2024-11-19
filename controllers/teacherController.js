const { User, Material, Group, MaterialGroup, UserRequest } = require('../models')
const { Op } = require('sequelize')

// controllers/teacherController.js

const exerciseTypes = [
  { text: 'Quiz', callback_data: 'exerciseType_quiz' },
  { text: 'Vocabulary Training', callback_data: 'exerciseType_vocabulary' },
  { text: 'Q&A Session', callback_data: 'exerciseType_qa' },
  { text: 'Know Your Meme', callback_data: 'exerciseType_meme' },
  { text: 'Picture Quiz', callback_data: 'exerciseType_picture_quiz' },
  { text: 'World Trivia', callback_data: 'exerciseType_world_trivia' }
]

 // Helper function to validate invite links
const isValidInviteLink = (link) => {
  const validPatterns = [
    /^https?:\/\/t\.me\/\+[a-zA-Z0-9_-]+$/,
    /^https?:\/\/t\.me\/joinchat\/[a-zA-Z0-9_-]+$/,
    /^https?:\/\/telegram\.me\/\+[a-zA-Z0-9_-]+$/,
    /^https?:\/\/telegram\.me\/joinchat\/[a-zA-Z0-9_-]+$/
  ];
  
  return validPatterns.some(pattern => pattern.test(link));
}

const EXPIRY_MINUTES = 5;

module.exports = {
  listMaterials : async ctx => {
    // Ensure the command is used in a private chat
    if (ctx.chat.type !== 'private') {
      await ctx.reply('Please use this command in a private chat with the bot.')
      return
    }

    const user = await User.findOne({
      where: { telegram_id: ctx.from.id.toString() }
    })
    if (!user || user.role !== 'teacher') {
      await ctx.reply('You are not registered as a teacher.')
      return
    }

    try {
      const materials = await Material.findAll({
        where: { teacher_id: user.user_id }
      })

      if (materials.length === 0) {
        await ctx.reply('You have not uploaded any materials yet.')
        return
      }

      let message = 'Here are your uploaded materials:\n'
      materials.forEach((material, index) => {
        message += `\n${index + 1}. ID: ${material.material_id}\n   Type: ${
          material.exercise_type
        }\n   Created At: ${material.createdAt}\n`
      })

      await ctx.reply(message)
    } catch (error) {
      console.error('Error in listMaterials:', error)
      await ctx.reply('An error occurred while retrieving your materials.')
    }
  },

  uploadMaterial: async ctx => {
    const user = await User.findOne({
      where: { telegram_id: ctx.from.id.toString() }
    })
    if (user && user.role === 'teacher') {
      ctx.session.uploadStep = 'chooseExerciseType'
      await ctx.reply('Please choose the type of exercise:', {
        reply_markup: {
          inline_keyboard: exerciseTypes.map(type => [type])
        }
      })
    } else {
      await ctx.reply('You are not registered as a teacher.')
    }
  },
  updateMaterial: async ctx => {
    // Ensure the command is used in a private chat
    if (ctx.chat.type !== 'private') {
      await ctx.reply('Please use this command in a private chat with the bot.');
      return;
    }

    const user = await User.findOne({ where: { telegram_id: ctx.from.id.toString() } });
    if (!user || user.role !== 'teacher') {
      await ctx.reply('You are not registered as a teacher.');
      return;
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
      await ctx.reply('Usage: /update_material [material_id]');
      return;
    }

    const materialId = args[1];

    try {
      const material = await Material.findOne({ where: { material_id: materialId, teacher_id: user.user_id } });
      if (!material) {
        await ctx.reply('Material not found or does not belong to you.');
        return;
      }

      // Start the update process
      ctx.session.updateMaterialId = materialId;
      ctx.session.updateStep = 'awaitingNewContent';
      await ctx.reply('Please send the new content for the material.');
    } catch (error) {
      console.error('Error in updateMaterial:', error);
      await ctx.reply('An error occurred while initiating the material update.');
    }
  },
  
  // Handle receiving new content
  receiveUpdatedMaterial : async (ctx) => {
    if (ctx.session && ctx.session.updateStep === 'awaitingNewContent') {
      const user = await User.findOne({ where: { telegram_id: ctx.from.id.toString() } });
      if (user) {
        const materialId = ctx.session.updateMaterialId;
        const material = await Material.findOne({ where: { material_id: materialId, teacher_id: user.user_id } });

        if (!material) {
          await ctx.reply('Material not found or does not belong to you.');
          ctx.session.updateStep = null;
          ctx.session.updateMaterialId = null;
          return;
        }

        // Update the material's content
        material.content = ctx.message.text;
        await material.save();

        ctx.session.updateStep = null;
        ctx.session.updateMaterialId = null;

        await ctx.reply(`Material ${materialId} has been updated.`);
      } else {
        await ctx.reply('User not found.');
      }
    }
  },
  
  deleteMaterial : async ctx => {
    // Ensure the command is used in a private chat
    if (ctx.chat.type !== 'private') {
      await ctx.reply('Please use this command in a private chat with the bot.')
      return
    }

    const user = await User.findOne({
      where: { telegram_id: ctx.from.id.toString() }
    })
    if (!user || user.role !== 'teacher') {
      await ctx.reply('You are not registered as a teacher.')
      return
    }

    const args = ctx.message.text.split(' ')
    if (args.length < 2) {
      await ctx.reply('Usage: /delete_material [material_id]')
      return
    }

    const materialId = args[1]

    try {
      const material = await Material.findOne({
        where: { material_id: materialId, teacher_id: user.user_id }
      })
      if (!material) {
        await ctx.reply('Material not found or does not belong to you.')
        return
      }

      await material.destroy()
      await ctx.reply(`Material ${materialId} has been deleted.`)
    } catch (error) {
      console.error('Error in deleteMaterial:', error)
      await ctx.reply('An error occurred while deleting the material.')
    }
  },

  handleExerciseTypeSelection: async ctx => {
    const exerciseType = ctx.match[1]
    ctx.session.exerciseType = exerciseType
    ctx.session.uploadStep = 'awaitingContent'
    await ctx.reply(
      `You selected *${exerciseType}*. Now, please send the content or file you wish to upload.`,
      {
        parse_mode: 'Markdown'
      }
    )
  },

    receiveMaterial: async (ctx) => {
    if (ctx.session && ctx.session.uploadStep === 'awaitingContent') {
      const user = await User.findOne({ where: { telegram_id: ctx.from.id.toString() } });
      if (user) {
        const materialData = {
          teacher_id: user.user_id,
          exercise_type: ctx.session.exerciseType,
        };

        switch (ctx.session.exerciseType) {
          case 'quiz':
            // Handle quiz
            try {
              const quizData = JSON.parse(ctx.message.text);
              // Validate quiz data structure
              if (!Array.isArray(quizData.questions)) {
                await ctx.reply('Invalid quiz format. Please ensure it has a "questions" array.');
                return;
              }
              quizData.questions.forEach((question) => {
                if (
                  typeof question.question !== 'string' ||
                  !Array.isArray(question.options) ||
                  typeof question.correct_option_id !== 'number'
                ) {
                  throw new Error('Invalid question format.');
                }
              });
              materialData.quiz_data = quizData;
              materialData.content = ctx.message.text; // Store the raw content
            } catch (error) {
              await ctx.reply('Failed to parse quiz data. Please ensure it is valid JSON in the correct format.');
              return;
            }
            break;

          case 'vocabulary':
            // Handle vocabulary
            try {
              const vocabData = JSON.parse(ctx.message.text);
              // Validate vocabulary data structure
              if (!Array.isArray(vocabData)) {
                await ctx.reply('Invalid vocabulary format. Please ensure it is an array of terms.');
                return;
              }
              vocabData.forEach((entry) => {
                if (typeof entry.term !== 'string' || typeof entry.definition !== 'string') {
                  throw new Error('Each entry must have "term" and "definition" as strings.');
                }
              });
              materialData.vocab_data = vocabData;
              materialData.content = ctx.message.text; // Store the raw content
            } catch (error) {
              await ctx.reply('Failed to parse vocabulary data. Please ensure it is valid JSON in the correct format.');
              return;
            }
            break;

          case 'meme':
          case 'picture_quiz':
            // Handle memes and picture quizzes
            if (ctx.message.photo || ctx.message.sticker) {
              // Save the file ID
              const fileId = ctx.message.photo
                ? ctx.message.photo[ctx.message.photo.length - 1].file_id // Get the highest resolution photo
                : ctx.message.sticker.file_id;
              materialData.media_file_id = fileId;
              materialData.content = ctx.message.caption || '';
            } else {
              await ctx.reply('Please send an image or sticker for this exercise.');
              return;
            }
            break;

          case 'world_trivia':
            // Handle world trivia questions
            try {
              const triviaData = JSON.parse(ctx.message.text);
              // Validate trivia data structure
              if (!Array.isArray(triviaData.questions)) {
                await ctx.reply('Invalid trivia format. Please ensure it has a "questions" array.');
                return;
              }
              triviaData.questions.forEach((question) => {
                if (
                  typeof question.question !== 'string' ||
                  !Array.isArray(question.options) ||
                  typeof question.correct_option_id !== 'number'
                ) {
                  throw new Error('Invalid question format in trivia.');
                }
              });
              materialData.trivia_data = triviaData;
              materialData.content = ctx.message.text; // Store the raw content
            } catch (error) {
              await ctx.reply('Failed to parse trivia data. Please ensure it is valid JSON in the correct format.');
              return;
            }
            break;

          case 'qa':
            // Handle Q&A
            // For Q&A, the content is the material that students will ask questions about
            if (ctx.message.text) {
              materialData.content = ctx.message.text;
            } else {
              await ctx.reply('Please send the text content for the Q&A session.');
              return;
            }
            break;

          default:
            await ctx.reply('Unknown exercise type.');
            return;
        }

        // Save the material
        const material = await Material.create(materialData);

        // Associate material with the teacher's groups
        const groups = await Group.findAll({ where: { teacher_id: user.user_id } });

        // Use the junction table MaterialGroup to associate the material with the groups
        await material.addGroups(groups);

        ctx.session.uploadStep = null;
        ctx.session.exerciseType = null;
        await ctx.reply('Material uploaded and associated with your groups successfully.');

        // Notify groups about the new material
        for (const group of groups) {
          await ctx.telegram.sendMessage(
            group.chat_id,
            `New *${material.exercise_type}* uploaded by ${user.name}.`,
            { parse_mode: 'Markdown' }
          );
        }
      } else {
        await ctx.reply('User not found.');
      }
    } else {
      await ctx.reply('Please start the upload process using /upload.');
    }
  },
  scheduleMessage: async (ctx) => {
    // Ensure the command is used in a private chat
    if (ctx.chat.type !== 'private') {
      await ctx.reply('Please use this command in a private chat with the bot.');
      return;
    }

    const user = await User.findOne({ where: { telegram_id: ctx.from.id.toString() } });
    if (!user || user.role !== 'teacher') {
      await ctx.reply('You are not registered as a teacher.');
      return;
    }

    // Parse the command arguments
    const args = ctx.message.text.split(' ');
    if (args.length < 3) {
      await ctx.reply('Usage: /schedule [material_id] [YYYY-MM-DD HH:MM]');
      return;
    }

    const materialId = args[1];
    const scheduledTimeStr = args.slice(2).join(' ');
    const scheduledTime = new Date(scheduledTimeStr);

    if (isNaN(scheduledTime.getTime())) {
      await ctx.reply('Invalid date and time format. Please use YYYY-MM-DD HH:MM.');
      return;
    }

    try {
      // Check if the material exists and belongs to the teacher
      const material = await Material.findOne({ where: { material_id: materialId, teacher_id: user.user_id } });
      if (!material) {
        await ctx.reply('Material not found or does not belong to you.');
        return;
      }

      // Save the scheduled task
      await ScheduledTask.create({
        teacher_id: user.user_id,
        material_id: material.material_id,
        scheduled_time: scheduledTime,
      });

      await ctx.reply(`Material scheduled for ${scheduledTime.toLocaleString()}.`);
    } catch (error) {
      console.error('Error in scheduleMessage:', error);
      await ctx.reply('An error occurred while scheduling the message.');
    }
  },
  cancelScheduledTask : async (ctx) => {
    // Ensure the command is used in a private chat
    if (ctx.chat.type !== 'private') {
      await ctx.reply('Please use this command in a private chat with the bot.');
      return;
    }

    const user = await User.findOne({ where: { telegram_id: ctx.from.id.toString() } });
    if (!user || user.role !== 'teacher') {
      await ctx.reply('You are not registered as a teacher.');
      return;
    }

    const args = ctx.message.text.split(' ');
    if (args.length < 2) {
      await ctx.reply('Usage: /cancel_schedule [task_id]');
      return;
    }

    const taskId = args[1];

    try {
      const task = await ScheduledTask.findOne({ where: { task_id: taskId, teacher_id: user.user_id } });
      if (!task) {
        await ctx.reply('Scheduled task not found or does not belong to you.');
        return;
      }

      await task.destroy();
      await ctx.reply(`Scheduled task ${taskId} has been canceled.`);
    } catch (error) {
      console.error('Error in cancelScheduledTask:', error);
      await ctx.reply('An error occurred while canceling the scheduled task.');
    }
  },

  registerGroup: async (ctx) => {
    // Ensure private chat
    if (ctx.chat.type !== 'private') {
      await ctx.reply('Please use this command in a private chat with the bot.');
      return;
    }

    const user = await User.findOne({ 
      where: { telegram_id: ctx.from.id.toString() } 
    });
    
    if (!user || user.role !== 'teacher') {
      await ctx.reply('You are not registered as a teacher.');
      return;
    }

    try {
      // Create new request
      const expiryTime = new Date(Date.now() + EXPIRY_MINUTES * 60000);
      
      await UserRequest.create({
        user_id: user.user_id,
        type: 'BOT_JOIN_CHAT',
        expires_at: expiryTime
      });

      await ctx.reply(
        '✅ Registration request initiated!\n\n' +
        'Please follow these steps:\n' +
        '1. Add me to your target group\n' +
        '2. Make me an administrator\n\n' +
        `⏳ This request will expire in ${EXPIRY_MINUTES} minutes.\n\n` +
        '*Note: You must be an admin of the group.*',
        { parse_mode: 'Markdown' }
      );

    } catch (error) {
      console.error('Error creating registration request:', error);
      await ctx.reply('An error occurred. Please try again later.');
    }
  },

  handleBotJoinRequest: async (ctx) => {
    const newChatMember = ctx.message.new_chat_member;
    
    // Check if our bot was added
    if (newChatMember.id.toString() !== ctx.botInfo.id.toString()) {
      return;
    }

    try {
      // Get chat admins
      const admins = await ctx.telegram.getChatAdministrators(ctx.chat.id);
      const addedByUserId = ctx.from.id.toString();

      // Find pending request for this user
      const pendingRequest = await UserRequest.findOne({
        where: {
          status: 'PENDING',
          type: 'BOT_JOIN_CHAT',
          expires_at: {
            [Op.gt]: new Date() // not expired
          },
          '$User.telegram_id$': addedByUserId
        },
        include: [{
          model: User,
          required: true
        }]
      });

      // Check if request exists and user is admin
      const isUserAdmin = admins.some(admin => 
        admin.user.id.toString() === addedByUserId
      );

      if (!pendingRequest || !isUserAdmin) {
        // Leave the chat and notify user
        await ctx.telegram.leaveChat(ctx.chat.id);
        
        if (!pendingRequest) {
          await ctx.telegram.sendMessage(
            addedByUserId,
            '❌ Group registration failed!\n\n' +
            'Reason: You must start the group registration process in a private chat with the bot.'
          );
        }
        if (pendingRequest) {
          await ctx.telegram.sendMessage(
            pendingRequest.User.telegram_id,
            '❌ Group registration failed!\n\n' +
            'Reason: You must be an administrator of the group.'
          );
        }
        return;
      }

      // Check if bot is admin
      const isBotAdmin = admins.some(admin => 
        admin.user.id.toString() === ctx.botInfo.id.toString()
      );

      if (!isBotAdmin) {
        await ctx.telegram.sendMessage(
          pendingRequest.User.telegram_id,
          '⚠️ Please make me an administrator of the group.\n\n' +
          'I need admin rights to:\n' +
          '• Send messages and media\n' +
          '• Create polls for quizzes\n' +
          '• Manage interactive elements\n\n' +
          '• Monitor group activity\n\n' +
          `You have ${EXPIRY_MINUTES} minutes to grant admin rights.`
        );
        return;
      }

      // Register the group
      await Group.create({
        chat_id: ctx.chat.id.toString(),
        name: ctx.chat.title || 'Unnamed Group',
        teacher_id: pendingRequest.user_id,
        type: ctx.chat.type,
        member_count: ctx.chat.member_count || 0
      });

      // Update request status
      await pendingRequest.update({ status: 'COMPLETED' });

      // Notify success
      await ctx.telegram.sendMessage(
        pendingRequest.User.telegram_id,
        `✅ Group "${ctx.chat.title}" registered successfully!\n\n` +
        'Available commands:\n' +
        '• /upload - Upload new materials\n' +
        '• /schedule - Schedule content\n' +
        '• /my_groups - View your groups\n' +
        '• /help - View all commands'
      );

      // Notify the group
      await ctx.reply(
        '🎓 This group has been registered as a learning group!\n\n' +
        'Students can now:\n' +
        '• Participate in quizzes\n' +
        '• Practice vocabulary\n' +
        '• Join Q&A sessions\n' +
        '• And more!\n\n' +
        'Use /help to see available commands.'
      );

    } catch (error) {
      console.error('Error in handleBotJoinRequest:', error);
      // Attempt to leave chat on error
      try {
        await ctx.telegram.leaveChat(ctx.chat.id);
      } catch (leaveError) {
        console.error('Error leaving chat:', leaveError);
      }
    }
  },

  listRegisteredGroups: async (ctx) => {
    // Ensure the command is used in a private chat
    if (ctx.chat.type !== 'private') {
      await ctx.reply('Please use this command in a private chat with the bot.');
      return;
    }

    const user = await User.findOne({ where: { telegram_id: ctx.from.id.toString() } });
    if (!user || user.role !== 'teacher') {
      await ctx.reply('You are not registered as a teacher.');
      return;
    }

    try {
      const groups = await Group.findAll({ where: { teacher_id: user.user_id } });

      if (groups.length === 0) {
        await ctx.reply('You have not registered any groups yet.');
        return;
      }

      let message = 'Here are your registered groups:\n';
      groups.forEach((group, index) => {
        message += `\n${index + 1}. ${group.name} (ID: ${group.chat_id})`;
      });

      await ctx.reply(message);
    } catch (error) {
      console.error('Error in listRegisteredGroups:', error);
      await ctx.reply('An error occurred while retrieving your groups.');
    }
  },
}
