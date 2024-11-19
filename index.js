const { Telegraf, session, Scenes } = require('telegraf')
const cron = require('node-cron')
const { Op } = require('sequelize') // Import Op from Sequeliz

const { BOT_TOKEN } = require('./config')
// const Filter = require('bad-words')
const leoProfanity = require('leo-profanity')

const bot = new Telegraf(BOT_TOKEN)

// const filter = new Filter()
leoProfanity.loadDictionary()

const { sequelize, User,ScheduledTask, Material, Group } = require('./models')

const teacherController = require('./controllers/teacherController')
const studentController = require('./controllers/studentController')
const botEventController = require('./controllers/botEventController')
const { message } = require('telegraf/filters')
const { SceneContextScene } = require('telegraf/scenes')
const stage = require('./scenes')

// Schedule a cron job to run every minute
cron.schedule('* * * * *', async () => {
  try {
    // make sure connection is established
    // TODO: handle connection error
    
    await sequelize.authenticate()


    const now = new Date()
    const tasks = await ScheduledTask.findAll({
      where: {
        executed: false,
        scheduled_time: { [Op.lte]: now }
      }
    })

    for (const task of tasks) {
      const material = await Material.findByPk(task.material_id)
      const teacherGroups = await Group.findAll({
        where: { teacher_id: task.teacher_id }
      })

      // Send the material to each group
      for (const group of teacherGroups) {
        if (material.exercise_type === 'quiz') {
          // Handle quiz
          const quizData = material.quiz_data
          for (const question of quizData.questions) {
            await bot.telegram.sendPoll(
              group.chat_id,
              question.question,
              question.options,
              {
                type: 'quiz',
                correct_option_id: question.correct_option_id,
                is_anonymous: false
              }
            )
          }
        } else if (
          material.exercise_type === 'vocabulary' ||
          material.exercise_type === 'q&a'
        ) {
          // Send the content directly
          await bot.telegram.sendMessage(group.chat_id, material.content)
        }
        // Handle other exercise types if necessary
        else if (
          material.exercise_type === 'meme' ||
          material.exercise_type === 'picture_quiz'
        ) {
          if (material.media_file_id) {
            await bot.telegram.sendPhoto(
              group.chat_id,
              material.media_file_id,
              {
                caption: material.content || ''
              }
            )
          }
        }
      }

      // Mark the task as executed
      task.executed = true
      await task.save()
    }
  } catch (error) {
    console.error('Error executing scheduled tasks:', error)
  }
})


// Use session middleware
bot.use(session())

// Register scenes
bot.use(stage.middleware());

// Scene entry middleware
bot.use(async (ctx, next) => {
  if (!ctx.message) return next();

  const user = await User.findOne({ 
    where: { telegram_id: ctx.from.id.toString() } 
  });

  // Enter appropriate scene based on chat type and user role
  if (ctx.chat.type === 'private') {
    if (!ctx.scene.current) {
      await ctx.scene.enter('private');
    }
  } else if (['group', 'supergroup'].includes(ctx.chat.type)) {
    if (!ctx.scene.current) {
      await ctx.scene.enter('group');
    }
  }

  // Also enter role-specific scene if user is registered
  if (user) {
    if (user.role === 'teacher' && !ctx.scene.current) {
      await ctx.scene.enter('teacher');
    } else if (user.role === 'student' && !ctx.scene.current) {
      await ctx.scene.enter('student');
    }
  }

  return next();
});



// Middleware to filter messages
bot.use(async(ctx, next) => {
  if (ctx.message && ctx.message.text) {
    // if (filter.isProfane(ctx.message.text)) {
    //   // Ignore or handle the profane message
    //   console.log(`Filtered profane message from ${ctx.from.username}`)
    //   return // Do not proceed with handling this message
    // }
    if (leoProfanity.check(ctx.message.text)) {
      // Message contains profanity
      console.log(`Filtered profane message from ${ctx.from.username}`)
      // Optionally, you can send a warning to the user
      await ctx.reply('Please refrain from using inappropriate language.')
      return // Do not proceed with handling this message
    }

  }
  return next()
})

// Retrieve the bot's username
let BOT_USERNAME = 'learningHelperBot' // Replace with your bot's actual username

bot.telegram.getMe().then(botInfo => {
  BOT_USERNAME = botInfo.username
})

// Middleware to log messages (optional)
bot.use((ctx, next) => {
  console.log(
    `Received message from ${ctx.from.username}: ${
      ctx.message ? ctx.message.text : JSON.stringify(ctx.update)
    }`
  )
  return next()
})

// Start command handler
bot.start(async ctx => {
  await ctx.scene.leave();
  // TODO: Check if the user is already registered
  const user = await User.findOne({ where: { telegram_id: ctx.from.id.toString() } })
  // console.log("found user", user)
  if (user) {
    await ctx.reply('Welcome back!')
  } else {
    // TODO: Add a welcome message
    await ctx.reply('Welcome! Are you a Teacher or a Student?', {
    reply_markup: {
      keyboard: [['Teacher', 'Student']],
      one_time_keyboard: true,
      resize_keyboard: true
      }
    })
  }
})



// Global commands (available in all scenes)
bot.command('help', async (ctx) => {
  const scene = ctx.scene.current?.id;
  const helpText =
    '*LearningHelper Bot Commands:*\n\n' +
    '**General Commands:**\n\n' +
    '\\- `/start` \\- Start interacting with the bot and select your role\\.\n' +
    '\\- `/help` \\- Display this help message\\.\n\n' +
    '**Note:** Replace `@' + BOT_USERNAME + '` with the bot\'s actual username when mentioning or messaging\\.\n\n' +
    '*Need further assistance?* Feel free to reach out to your teacher or contact the bot developer\\.\n\n' +
    '*Happy learning\\!*'
    ; // Function to get context-specific help
  await ctx.reply(helpText);
});

// Handler for callback queries
bot.on('callback_query', botEventController.handleCallbackQuery)


  
// Handler for messages that mention the bot
bot.on(message('text'), botEventController.handleRejectText);
bot.on(message('reply'), botEventController.handleRejectReply);
bot.on(message('mention'), botEventController.handleRejectMention);
// bot.on(message('new_chat_members'), botEventController.handleBotJoin);
// bot.on(message('left_chat_member'), botEventController.handleBotLeave);



// Add these updated handlers instead
bot.use(Telegraf.chatType(['group', 'supergroup'], async (ctx, next) => {
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

// Handle mentions and replies using message filters
// bot.on('message', async (ctx, next) => {
//   if (!ctx.message.text) return next();

//   // Handle mentions
//   if (ctx.message.entities?.some(e => 
//     e.type === 'mention' && 
//     ctx.message.text.substring(e.offset, e.offset + e.length) === `@${ctx.botInfo.username}`
//   )) {
//     await botEventController.handleMention(ctx);
//   }

//   // Handle replies to bot
//   if (ctx.message.reply_to_message?.from?.id === ctx.botInfo.id) {
//     await botEventController.handleReply(ctx);
//   }

//   return next();
// });

// Handle member updates using my_chat_member
// bot.on('my_chat_member', async (ctx) => {
//   const update = ctx.myChatMember;
  
//   if (update.new_chat_member.status === 'member') {
//     // Bot was added to group
//     await botEventController.handleBotJoin(ctx);
//   } else if (update.new_chat_member.status === 'left' || update.new_chat_member.status === 'kicked') {
//     // Bot was removed from group
//     await botEventController.handleBotLeave(ctx);
//   }
// });

// Handle chat member updates
bot.on('chat_member_updated', async (ctx) => {
  const update = ctx.chatMember;
  await botEventController.handleMemberUpdates(ctx);
});



// Error handling
bot.catch((err, ctx) => {
  console.error(`Error while handling update ${ctx.update.update_id}:`, err)
})

// Sync database and launch the bot
sequelize
  // .sync({force:true})
  .sync()
  .then(() => {
    bot
      .launch()
      .then(() => {
        console.log('Bot started')
      })
      .catch(err => {
        console.error('Failed to launch bot:', err)
      })
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err)
  })

// Enable graceful stop
process.once('SIGINT', () => {
  console.log('Shutting down bot...')
  bot.stop('SIGINT')
  sequelize.close()
})
process.once('SIGTERM', () => {
  console.log('Shutting down bot...')
  bot.stop('SIGTERM')
  sequelize.close()
})


