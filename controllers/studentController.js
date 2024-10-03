const { Group } = require('../models');
const aiService = require('../services/aiService');

module.exports = {
  handleStudentQuestion: async (ctx) => {
    const question = ctx.message.text;
    const chatId = ctx.chat.id.toString();

    // Find the group
    const group = await Group.findOne({ where: { chat_id: chatId } });
    if (group) {
      // Get latest material associated with the group
      const materials = await group.getMaterials({
        order: [['material_id', 'DESC']],
        limit: 1
      });
      if (materials && materials.length > 0) {
        const material = materials[0];
        // Use AI service to answer the question
        const answer = await aiService.getAnswer(question, material.content);
        await ctx.reply(answer);
      } else {
        await ctx.reply('No material available to answer your question.');
      }
    } else {
      await ctx.reply('This group is not registered.');
    }
  }
};
