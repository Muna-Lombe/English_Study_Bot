// const restify = require('restify');
// const { CloudAdapter,BotFrameworkAdapter, MemoryStorage, ConversationState } = require('botbuilder');

// const server = restify.createServer();
// const port = process.env.port || process.env.PORT || 3978;
// server.listen(port, () => {
//   console.log(`${server.name} listening to http://localhost:${port}`);
// });

// const adapter = new CloudAdapter({
//   appId: process.env.MicrosoftAppId,
//   appPassword: process.env.MicrosoftAppPassword
// });

// const storage = new MemoryStorage();
// const conversationState = new ConversationState(storage);

// adapter.onTurnError = async (context, error) => {
//   console.error(`Error: ${error}`);
//   await context.sendActivity('An error occurred. Please try again later.');
// };

// server.post('/api/messages', async(req, res) => {
//   adapter.processActivity(req, res, async (context) => {
//     if (context.activity.type === 'message') {
//       const text = context.activity.text.toLowerCase();
//       if (text.includes('hello')) {
//         await context.sendActivity('Hello! How can I assist you today?');
//       } else {
//         await context.sendActivity("I'm sorry, I don't understand.");
//       }
//     }
//   });
// });

const { Telegraf, session } = require('telegraf');
const { BOT_TOKEN } = require('./config');
const bot = new Telegraf(BOT_TOKEN);

const { sequelize } = require('./models');
const teacherController = require('./controllers/teacherController');
const studentController = require('./controllers/studentController');

// Use session middleware
bot.use(session());

// Middleware to log messages (optional)
bot.use((ctx, next) => {
  console.log(`Received message from ${ctx.from.username}: ${ctx.message ? ctx.message.text : ''}`);
  return next();
});

// Start command handler
bot.start(async (ctx) => {
  await ctx.reply('Welcome! Are you a Teacher or a Student?', {
    reply_markup: {
      keyboard: [['Teacher', 'Student']],
      one_time_keyboard: true,
      resize_keyboard: true
    }
  });
});

// Handle role selection
bot.hears(['Teacher', 'Student'], async (ctx) => {
  const role = ctx.message.text;
  // Save user role to database
  const { User } = require('./models');
  await User.upsert({
    telegram_id: ctx.from.id,
    role: role.toLowerCase(),
    name: ctx.from.first_name
  });
  await ctx.reply(`You are registered as a ${role}.`);
});

// Teacher commands
bot.command('upload', teacherController.uploadMaterial);
bot.command('register_group', teacherController.registerGroup);

// Handle text messages
bot.on('text', async (ctx) => {
  // Check if user is uploading material
  if (ctx.session && ctx.session.isUploading) {
    await teacherController.receiveMaterial(ctx);
  } else {
    // Handle student question
    await studentController.handleStudentQuestion(ctx);
  }
});

// Sync database and launch the bot
sequelize.sync().then(() => {
  bot.launch().then(() => {
    console.log('Bot started');
  });
}).catch((err) => {
  console.error('Unable to connect to the database:', err);
});

// Enable graceful stop
process.once('SIGINT', () => {
  bot.stop('SIGINT');
  sequelize.close();
});
process.once('SIGTERM', () => {
  bot.stop('SIGTERM');
  sequelize.close();
});
