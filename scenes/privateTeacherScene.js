const { Scenes } = require('telegraf');
const teacherController = require('../controllers/teacherController');

const privateTeacherScene = new Scenes.BaseScene('privateTeacher');

// Scene enter handler
privateTeacherScene.enter(async (ctx) => {
  await ctx.reply(
    '👋 Welcome to your teacher dashboard!\n' +
    'Use /help to see available commands.'
  );
});

// Help command handler
privateTeacherScene.command('help', async (ctx) => {
  await ctx.reply(
    '*Teacher Commands:*\n\n' +
    '📚 *Material Management*\n' +
    '/upload - Upload new learning materials\n' +
    '/list_materials - View your materials\n' +
    '/update_material - Update existing material\n' +
    '/delete_material - Remove material\n\n' +
    '👥 *Group Management*\n' +
    '/register_group - Register a new group\n' +
    '/my_groups - List your groups\n\n' +
    '⏰ *Scheduling*\n' +
    '/schedule - Schedule material delivery\n' +
    '/cancel_schedule - Cancel scheduled task',
    { parse_mode: 'Markdown' }
  );
});

// Teacher-specific commands
privateTeacherScene.command('upload', teacherController.uploadMaterial);
privateTeacherScene.command('my_groups', teacherController.listRegisteredGroups);
privateTeacherScene.command('register_group', teacherController.registerGroup);
privateTeacherScene.command('list_materials', teacherController.listMaterials);
privateTeacherScene.command('schedule', teacherController.scheduleMessage);
privateTeacherScene.command('cancel_schedule', teacherController.cancelScheduledTask);
privateTeacherScene.command('update_material', teacherController.updateMaterial);
privateTeacherScene.command('delete_material', teacherController.deleteMaterial);

// Handle material upload process
privateTeacherScene.on('text', async (ctx) => {
  if (ctx.session?.updateStep === 'awaitingNewContent') {
    await teacherController.receiveMaterial(ctx);
  }
});

// Handle forwarded messages for group registration
privateTeacherScene.on('message', async (ctx) => {
  if (ctx.message.forward_from || ctx.message.forward_from_chat) {
    await teacherController.registerGroup(ctx);
  }
});

module.exports = { privateTeacherScene }; 