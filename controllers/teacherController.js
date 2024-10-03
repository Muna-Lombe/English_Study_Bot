const { User, Material, Group } = require('../models');

module.exports = {
  uploadMaterial: async (ctx) => {
    // Check if user is a teacher
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (user && user.role === 'teacher') {
      // Set uploading flag in session
      ctx.session.isUploading = true;
      await ctx.reply('Please send the content or file you wish to upload.');
    } else {
      await ctx.reply('You are not registered as a teacher.');
    }
  },

  receiveMaterial: async (ctx) => {
    if (ctx.session && ctx.session.isUploading) {
      const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
      if (user) {
        // Save the material
        const material = await Material.create({
          teacher_id: user.user_id,
          content: ctx.message.text // Handle files if necessary
        });
        // Get the teacher's groups
        const groups = await Group.findAll({ where: { teacher_id: user.user_id } });
        // Associate material with groups
        await material.setGroups(groups);
        ctx.session.isUploading = false;
        await ctx.reply('Material uploaded and associated with your groups successfully.');

        // Optionally, send the material to the groups
        for (const group of groups) {
          await ctx.telegram.sendMessage(group.chat_id, `New material uploaded:\n\n${material.content}`);
        }
      } else {
        await ctx.reply('User not found.');
      }
    }
  },

  registerGroup: async (ctx) => {
    const user = await User.findOne({ where: { telegram_id: ctx.from.id } });
    if (user && user.role === 'teacher') {
      const chatId = ctx.chat.id.toString();
      const chatTitle = ctx.chat.title;
      // Save group to database
      await Group.upsert({
        chat_id: chatId,
        name: chatTitle,
        teacher_id: user.user_id
      });
      await ctx.reply('Group registered successfully.');
    } else {
      await ctx.reply('You are not registered as a teacher.');
    }
  }
};
