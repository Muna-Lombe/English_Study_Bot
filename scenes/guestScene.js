const { Scenes } = require('telegraf');
const { User } = require('../models');

const guestScene = new Scenes.BaseScene('guest');

// Scene enter handler
guestScene.enter(async (ctx) => {
  return await ctx.reply(
    '👋 Welcome to LearningHelper Bot!\n\n' +
    'To get started, please select your role:',
    {
      reply_markup: {
        keyboard: [['Teacher', 'Student']],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    }
  );
});

// Handle role selection
guestScene.hears(['Teacher', 'Student'], async (ctx) => {
  const role = ctx.message.text.toLowerCase();
  
  try {
    // Create new user
    await User.create({
      telegram_id: ctx.from.id.toString(),
      username: ctx.from.username || '',
      first_name: ctx.from.first_name,
      last_name: ctx.from.last_name || '',
      role: role
    });

    // Welcome message based on role
    if (role === 'teacher') {
      await ctx.reply(
        '🎓 Welcome, Teacher!\n\n' +
        'Here\'s what you can do:\n' +
        '• Create and manage learning materials\n' +
        '• Schedule exercises\n' +
        '• Monitor student progress\n\n' +
        'To get started, use these commands:\n' +
        '/create - Create new learning material\n' +
        '/schedule - Schedule an exercise\n' +
        '/groups - Manage your groups',
        { reply_markup: { remove_keyboard: true } }
      );
      await ctx.scene.enter('privateTeacher');
    } else {
      await ctx.reply(
        '📚 Welcome, Student!\n\n' +
        'Here\'s what you can do:\n' +
        '• Join learning groups\n' +
        '• Participate in exercises\n' +
        '• Track your progress\n\n' +
        'To get started, use these commands:\n' +
        '/join - Join a learning group\n' +
        '/practice - Start practicing\n' +
        '/progress - View your progress',
        { reply_markup: { remove_keyboard: true } }
      );
      await ctx.scene.enter('privateStudent');
    }
  } catch (error) {
    console.error('Error registering user:', error);
    await ctx.reply(
      '❌ Sorry, there was an error registering your account. Please try again later.'
    );
  }
});

// Handle invalid role selection
guestScene.on('message', async (ctx) => {
  await ctx.reply(
    '⚠️ Please select a valid role using the keyboard buttons.',
    {
      reply_markup: {
        keyboard: [['Teacher', 'Student']],
        one_time_keyboard: true,
        resize_keyboard: true
      }
    }
  );
});

module.exports = {guestScene};
