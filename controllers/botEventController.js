const { User, Group } = require('../models');
const teacherController = require('./teacherController');


// Helper function to send quiz questions
async function sendQuizQuestion (ctx) {
  const quiz = ctx.session.quiz
  const index = ctx.session.quizIndex

  if (index < quiz.questions.length) {
    const question = quiz.questions[index]
    ctx.session.currentAnswer = question.answer

    await ctx.reply(question.question, {
      reply_markup: {
        inline_keyboard: question.options.map(option => [
          { text: option, callback_data: `quizAnswer_${option}` }
        ])
      }
    })
  } else {
    await ctx.reply('Quiz completed! Great job!')
    ctx.session.quiz = null
    ctx.session.quizIndex = null
    ctx.session.currentAnswer = null
  }
}

module.exports = {
  handleCallbackQuery: async ctx => {
    const data = ctx.callbackQuery.data

    if (data.startsWith('exerciseType_')) {
      const exerciseType = data.split('_')[1]
      ctx.match = [data, exerciseType] // Simulate regex match for handler
      await teacherController.handleExerciseTypeSelection(ctx)
    } else if (data.startsWith('quizAnswer_')) {
      const selectedOption = data.split('_')[1]
      if (selectedOption === ctx.session.currentAnswer) {
        await ctx.reply('Correct!')
      } else {
        await ctx.reply(
          `Incorrect. The correct answer was: ${ctx.session.currentAnswer}`
        )
      }
      ctx.session.quizIndex += 1
      await sendQuizQuestion(ctx)
    }

    await ctx.answerCbQuery()
  },
  
  // Handle inline queries
  handleInlineQuery: async (ctx) => {
    try {
      const query = ctx.inlineQuery.query.toLowerCase();
      const user = await User.findOne({
        where: { telegram_id: ctx.from.id.toString() }
      });

      if (!user) {
        return await ctx.answerInlineQuery([{
          type: 'article',
          id: 'not_registered',
          title: 'Not Registered',
          description: 'Please start the bot in private chat first',
          input_message_content: {
            message_text: 'Please start @' + ctx.botInfo.username + ' in private chat first.'
          }
        }]);
      }

      // Different results based on user role
      if (user.role === 'teacher') {
        // For teachers - show their materials
        const materials = await Material.findAll({
          where: { teacher_id: user.user_id },
          limit: 50 // Telegram limit
        });

        const results = materials.map((material, index) => ({
          type: 'article',
          id: material.material_id,
          title: `${material.exercise_type} Material`,
          description: material.content.substring(0, 100) + '...',
          input_message_content: {
            message_text: material.content,
            parse_mode: 'Markdown'
          },
          reply_markup: {
            inline_keyboard: [[
              { 
                text: 'Start Exercise', 
                callback_data: `start_exercise_${material.material_id}` 
              }
            ]]
          }
        }));

        await ctx.answerInlineQuery(results, {
          cache_time: 300,
          is_personal: true,
          switch_pm_text: 'Upload New Material',
          switch_pm_parameter: 'upload'
        });

      } else {
        // For students - show available exercises
        const results = [
          {
            type: 'article',
            id: 'start_quiz',
            title: 'Start Quiz',
            description: 'Begin a new quiz session',
            input_message_content: {
              message_text: '/start_quiz'
            }
          },
          {
            type: 'article',
            id: 'vocab_practice',
            title: 'Vocabulary Practice',
            description: 'Start vocabulary training',
            input_message_content: {
              message_text: '/vocab'
            }
          },
          {
            type: 'article',
            id: 'meme_quiz',
            title: 'Meme Quiz',
            description: 'Start a meme-based quiz',
            input_message_content: {
              message_text: '/start_meme_quiz'
            }
          }
        ];

        await ctx.answerInlineQuery(results, {
          cache_time: 300,
          is_personal: true,
          switch_pm_text: 'View All Commands',
          switch_pm_parameter: 'help'
        });
      }

    } catch (error) {
      console.error('Error handling inline query:', error);
      await ctx.answerInlineQuery([{
        type: 'article',
        id: 'error',
        title: 'Error',
        description: 'An error occurred while processing your request',
        input_message_content: {
          message_text: 'Sorry, an error occurred. Please try again later.'
        }
      }]);
    }
  },
  // Bot being added to a group
  handleBotJoin: async (ctx) => {
    const chatId = ctx.chat?.id || ctx.myChatMember?.chat.id;
    const chatTitle = ctx.chat?.title || ctx.myChatMember?.chat.title;
    
    if (!chatId) return;

    console.log(`Bot added to group: ${chatTitle} (${chatId})`);
    // Additional logic handled by registerGroup command
    await teacherController.handleBotJoinRequest(ctx)

  },

  // Bot being removed from a group
  handleBotLeave: async (ctx) => {
    const chatId = ctx.chat?.id || ctx.myChatMember?.chat.id;
    const chatTitle = ctx.chat?.title || ctx.myChatMember?.chat.title;
    
    if (!chatId) return;
    
    try {
      await Group.destroy({
        where: { chat_id: chatId.toString() }
      });
      console.log(`Bot removed from group: ${chatTitle} (${chatId})`);
    } catch (error) {
      console.error('Error handling bot removal:', error);
    }
  },
  // Reject text messages
  handleRejectText: async (ctx) => {
    await ctx.reply('Please interact with me in the group using @mention.')
  },
  // Reject reply messages
  handleRejectReply: async (ctx) => {
    await ctx.reply('Please interact with me in the group using @mention.')
  },
  // Reject media messages
  handleRejectMedia: async (ctx) => {
    await ctx.reply('Please interact with me in the group using @mention.')
  },
  
  // Reject mention messages
  handleRejectMention: async (ctx) => {
    await ctx.reply('Please interact with me in the group using @mention.')
  },
  // Handle mention messages
  handleMention: async (ctx) => {
    const mention = `@${ctx.botInfo.username}`;
    if (!ctx.message.text.includes(mention)) return;

    await ctx.reply(
      'Hi! I noticed you mentioned me. Use /help to see what I can do!'
    );
  },

  // Message replied to bot's message
  handleReply: async (ctx) => {
    if (!ctx.message.reply_to_message?.from?.id === ctx.botInfo.id) return;

    await ctx.reply(
      'I noticed you replied to my message. How can I help?'
    );
  },

  // Chat member updates (e.g., user joins/leaves group)
  handleMemberUpdates: async (ctx) => {
    const member = ctx.chatMember;
    
    if (member.new_chat_member.status === 'member' && 
        member.old_chat_member.status !== 'member') {
      // New member joined
      await ctx.reply(
        `Welcome ${member.new_chat_member.user.first_name}! 👋`
      );
    } else if (member.new_chat_member.status === 'left' && 
               member.old_chat_member.status === 'member') {
      // Member left
      console.log(`User left: ${member.old_chat_member.user.first_name}`);
    }
  },
  handleStudentJoin: async (ctx) => {
    console.log("SCENE: group student scene");
    await ctx.scene.enter('groupStudent');
  },
  handleStudentLeave: async (ctx) => {
    console.log("SCENE: group student scene");
    await ctx.scene.leave();
  },
  handleStudentBan: async (ctx) => {
    console.log("SCENE: group student scene");
    await ctx.scene.leave();
  },
  handleStudentUnban: async (ctx) => {
    console.log("SCENE: group student scene");
    await ctx.scene.leave();
  },
  handleTeacherJoin: async (ctx) => {
    console.log("SCENE: group teacher scene");
    await ctx.scene.enter('groupTeacher');
  },
  handleTeacherLeave: async (ctx) => {
    console.log("SCENE: group teacher scene");
    await ctx.scene.leave();
  },

  handleText: async ctx => {
    console.log(ctx)
    const message = ctx.update.message
    const chat = message?.chat

    // Check if the message is in a group chat
    if (chat.type.endsWith('group')) {

      // Check if the bot is mentioned
      const entities = message.entities || []
      const botMentioned = entities.some(entity => {
        if (entity.type === 'mention') {
          const mention = message.text.substring(
            entity.offset,
            entity.offset + entity.length
          )
          return mention.toLowerCase() === '@' + BOT_USERNAME.toLowerCase()
        }
        return false
      })

      if (botMentioned) {
        // Extract the question directed at the bot
        const question = message.text
          .replace(new RegExp(`@${BOT_USERNAME}`, 'gi'), '')
          .trim()
        if (question.length > 0) {
          await studentController.handleStudentQuestion(ctx, question)
        } else {
          await ctx.reply('Please ask a question after mentioning me.')
        }
      }
    } 
  
    else if (chat.type === 'private') {
      // Handle private messages if needed
      if (ctx.session && ctx.session.updateStep === 'awaitingNewContent') {
        // Handle upload process
        
        await teacherController.receiveMaterial(ctx)
        await teacherController.receiveUpdatedMaterial(ctx)
      }
      else if (message.forward_from || message.forward_from_chat){
        await teacherController.registerGroup(ctx)
      }
      else{
        await ctx.reply('Please interact with me in the group using @mention.')
      }

    }
  }
}; 