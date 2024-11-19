const { User, Group } = require('../models');
const teacherController = require('./teacherController');

module.exports = {
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

  // Bot being mentioned in a message
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