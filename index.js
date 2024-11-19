const { Telegraf, session } = require('telegraf')
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

// Schedule a cron job to run every minute
cron.schedule('* * * * *', async () => {
  try {
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

// Help command handler
bot.command('help', async ctx => {
  const specialCharacters = ['\\', '_', '*', '`', '[', ']', '(', ')']
  const helpText = 
    '*LearningHelper Bot Commands:*\n\n' +
    '**General Commands:**\n\n' +
    '\\- `/start` \\- Start interacting with the bot and select your role\\.\n' +
    '\\- `/help` \\- Display this help message\\.\n\n' +
    '**Commands for Teachers:**\n\n' +
    '\\- `/upload` \\- Upload new learning materials and assign an exercise type\\.\n' +
    '\\- `/register_group` \\- Register a group by forwarding a message from the group to the bot in a private chat\\.\n' +
    '\\- `/my_groups` \\- View your registered groups\\.\n' +
    '\\- `/schedule \\[material_id\\] \\[YYYY\-MM\-DD HH:MM\\]` \\- Schedule a material to be sent at a specific time\\.\n' +
    '\\- `/cancel_schedule \\[task_id\\]` \\- Cancel a scheduled task\\.\n' +
    '\\- `/list_materials` \\- List all your uploaded materials\\.\n' +
    '\\- `/delete_material \\[material_id\\]` \\- Delete a material you\'ve uploaded\\.\n' +
    '\\- `/update_material \\[material_id\\]` \\- Update a material you\'ve uploaded\\.\n\n' +
    '**Commands for Students:**\n\n' +
    '\\- `/start_quiz` \\- Starts the latest quiz in the group\\.\n' +
    '\\- `/vocab` \\- Begins vocabulary training with the latest materials\\.\n' +
    '\\- `/start_meme_quiz` \\- Starts the latest "Know Your Meme" exercise\\.\n' +
    '\\- `/start_picture_quiz` \\- Starts the latest picture quiz\\.\n' +
    '\\- `/start_world_trivia` \\- Starts the latest world trivia quiz\\.\n' +
    '\\- `/ask` \\- Ask a question during a Q&A session\\.\n\n' +
    '**How to Use the Bot:**\n\n' +
    '*For Teachers:*\n\n' +
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
    '*For Students:*\n\n' +
    '1\\. **Participate in Exercises:**\n' +
    '  \\- Use the exercise commands in the group to start activities\\.\n' +
    '  \\- Example: `/start_quiz`, `/vocab`, `/start_meme_quiz`\\.\n\n' +
    '2\\. **Ask Questions:**\n' +
    '  \\- During a Q&A session, use the `/ask` command followed by your question\\.\n' +
    '  \\- Example: `/ask What is the capital of France?`\\.\n\n' +
    '**Note:** Replace `@' + BOT_USERNAME + '` with the bot\'s actual username when mentioning or messaging\\.\n\n' +
    '**Examples:**\n\n' +
    '\\- Starting a quiz: `/start_quiz`\\.\n' +
    '\\- Asking a question: `/ask How does photosynthesis work?`\\.\n\n' +
    '*Need further assistance?* Feel free to reach out to your teacher or contact the bot developer\\.\n\n' +
    '*Happy learning\\!*'

  await ctx.replyWithMarkdownV2(helpText)
})



// Handle role selection
bot.hears(['Teacher', 'Student'], async ctx => {
  const role = ctx.message.text.toLowerCase()
  try {
    await User.upsert({
      telegram_id: ctx.from.id.toString(),
      role: role,
      name: ctx.from.first_name
    })
    await ctx.reply(`You are registered as a ${role}.`)
  } catch (err) {
    console.error('Error saving user:', err)
    await ctx.reply('An error occurred while registering your role.')
  }
})

// Teacher commands
bot.command('upload', teacherController.uploadMaterial)
bot.command('my_groups', teacherController.listRegisteredGroups)
bot.command('register_group', teacherController.registerGroup)
bot.command('list_materials', teacherController.listMaterials)
bot.command('schedule', teacherController.scheduleMessage)
bot.command('cancel_schedule', teacherController.cancelScheduledTask)
bot.command('update_material', teacherController.updateMaterial)
bot.command('delete_material', teacherController.deleteMaterial)

// Student commands
bot.command('vocab', studentController.startVocabularyTraining)
bot.command('start_quiz', studentController.startQuiz)
bot.command('start_meme_quiz', studentController.startMemeQuiz)
bot.command('start_picture_quiz', studentController.startPictureQuiz)

// Handler for callback queries
bot.on('callback_query', async ctx => {
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
})

// Handle adding the bot to a group
bot.on('my_chat_member', async ctx => {
  console.log("my chat member",ctx)
})

// bot.on('update', (ctx) => {
//   console.log("update",ctx)
//   if (ctx.update.my_chat_member){
//     console.log("my chat member",ctx.update.my_chat_member)
//   }
// })
  
// Handler for messages that mention the bot
bot.on('text', botEventController.handleText)

// bot.on('message', async ctx => {
//   if (ctx.chat.type === 'private') {
//     // Check if the user is in the process of registering a group
//     // if (ctx.message.text && ctx.message.text.startsWith('/register_group')) {
//     //   // Handled in the command
//     //   return
//     // }

//     // Handle forwarded message for group registration
//     if (ctx.session && ctx.session.uploadStep === 'awaitingContent') {
//       await teacherController.receiveMaterial(ctx)
//     } else if (ctx.message.forward_from_chat) {
//       // Assume the teacher is forwarding a message to register a group
//       await teacherController.registerGroup(ctx)
//     } else {
//       await ctx.reply(
//         'Please use a valid command or type /help for assistance.'
//       )
//     }
//   }
// })

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
  return next();
}));

// Handle mentions and replies using message filters
bot.on('message', async (ctx, next) => {
  if (!ctx.message.text) return next();

  // Handle mentions
  if (ctx.message.entities?.some(e => 
    e.type === 'mention' && 
    ctx.message.text.substring(e.offset, e.offset + e.length) === `@${ctx.botInfo.username}`
  )) {
    await botEventController.handleMention(ctx);
  }

  // Handle replies to bot
  if (ctx.message.reply_to_message?.from?.id === ctx.botInfo.id) {
    await botEventController.handleReply(ctx);
  }

  return next();
});

// Handle member updates using my_chat_member
bot.on('my_chat_member', async (ctx) => {
  const update = ctx.myChatMember;
  
  if (update.new_chat_member.status === 'member') {
    // Bot was added to group
    await botEventController.handleBotJoin(ctx);
  } else if (update.new_chat_member.status === 'left' || update.new_chat_member.status === 'kicked') {
    // Bot was removed from group
    await botEventController.handleBotLeave(ctx);
  }
});

// Handle chat member updates
bot.on('chat_member_updated', async (ctx) => {
  const update = ctx.chatMember;
  await botEventController.handleMemberUpdates(ctx);
});

// Other useful event handlers:
// bot.on('text', (ctx) => {
//   // Handle text messages
// })

bot.on('callback_query', (ctx) => {
  // Handle button clicks
})

bot.on('inline_query', (ctx) => {
  // Handle inline queries
})

// bot.command('start', (ctx) => {
//   // Handle /start command
// })

// Error handling
bot.catch((err, ctx) => {
  console.error(`Error while handling update ${ctx.update.update_id}:`, err)
})

// Sync database and launch the bot
sequelize
  .sync({force:true})
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
