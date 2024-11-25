const teacherController = require('./teacherController');
const studentController = require('./studentController');
const { User, Group } = require('../models');

module.exports = {
  // Route group messages based on user role and context
  routeGroupMessage: async (ctx) => {
    // Check if bot is mentioned
    const isBotMentioned = ctx.message.entities?.some(entity => 
      entity.type === 'mention' && 
      ctx.message.text.substring(entity.offset, entity.offset + entity.length) === `@${ctx.botInfo.username}`
    );

    if (!isBotMentioned) return;

    const user = await User.findOne({ 
      where: { telegram_id: ctx.from.id.toString() } 
    });

    if (!user) {
      return await ctx.reply(
        'Please start me in private chat first to register.',
        { reply_to_message_id: ctx.message.message_id }
      );
    }

    // Get group info
    const group = await Group.findOne({
      where: { chat_id: ctx.chat.id.toString() }
    });

    if (!group) {
      return await ctx.reply(
        'This group is not registered. Teachers can register it using the /register command in private chat.',
        { reply_to_message_id: ctx.message.message_id }
      );
    }

    // Extract the actual message content without the mention
    const messageContent = ctx.message.text
      .replace(new RegExp(`@${ctx.botInfo.username}`, 'gi'), '')
      .trim();

    if (user.role === 'teacher') {
      // Check if this teacher owns this group
      if (group.teacher_id === user.user_id) {
        return await teacherController.handleGroupMessage(ctx, messageContent);
      } else {
        return await ctx.reply(
          'Only the teacher who registered this group can use teacher commands here.',
          { reply_to_message_id: ctx.message.message_id }
        );
      }
    } else {
      // For students, check if they're in this group
      const isStudentInGroup = await group.hasStudent(user.user_id);
      if (isStudentInGroup) {
        return await studentController.handleGroupMessage(ctx, messageContent);
      } else {
        return await ctx.reply(
          'Please join this group using the /join command in private chat first.',
          { reply_to_message_id: ctx.message.message_id }
        );
      }
    }
  },

  // Route group commands based on user role
  routeGroupCommand: async (ctx, command) => {
    const user = await User.findOne({ 
      where: { telegram_id: ctx.from.id.toString() } 
    });

    if (!user) {
      return await ctx.reply('Please start me in private chat first to register.');
    }

    const group = await Group.findOne({
      where: { chat_id: ctx.chat.id.toString() }
    });

    if (!group && command !== 'register') {
      return await ctx.reply(
        'This group is not registered. Teachers can register it using the /register command in private chat.'
      );
    }

    if (user.role === 'teacher') {
      if (group && group.teacher_id !== user.user_id) {
        return await ctx.reply('Only the teacher who registered this group can use teacher commands here.');
      }

      switch (command) {
        case 'start_exercise':
          return await teacherController.handleStartExercise(ctx);
        case 'end_exercise':
          return await teacherController.handleEndExercise(ctx);
        case 'stats':
          return await teacherController.handleGroupStats(ctx);
        default:
          return await ctx.reply('Unknown command. Use /help to see available commands.');
      }
    } else {
      if (group) {
        const isStudentInGroup = await group.hasStudent(user.user_id);
        if (!isStudentInGroup) {
          return await ctx.reply('Please join this group using the /join command in private chat first.');
        }
      }

      switch (command) {
        case 'answer':
          return await studentController.handleGroupAnswer(ctx);
        case 'help':
          return await studentController.handleGroupHelp(ctx);
        default:
          return await ctx.reply('Unknown command. Use /help to see available commands.');
      }
    }
  },

  // Handle group callback queries
  routeGroupCallback: async (ctx) => {
    const user = await User.findOne({ 
      where: { telegram_id: ctx.from.id.toString() } 
    });

    if (!user) {
      return await ctx.answerCbQuery('Please start me in private chat first to register.');
    }

    const data = ctx.callbackQuery.data;

    if (user.role === 'teacher') {
      if (data.startsWith('exercise_')) {
        return await teacherController.handleGroupExerciseCallback(ctx);
      }
    } else {
      if (data.startsWith('answer_')) {
        return await studentController.handleGroupAnswerCallback(ctx);
      }
    }

    await ctx.answerCbQuery();
  }
}; 