const restify = require('restify');
const { CloudAdapter,BotFrameworkAdapter, MemoryStorage, ConversationState } = require('botbuilder');

const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`${server.name} listening to ${server.url}`);
});

const adapter = new CloudAdapter({
  appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword
});

const storage = new MemoryStorage();
const conversationState = new ConversationState(storage);

adapter.onTurnError = async (context, error) => {
  console.error(`Error: ${error}`);
  await context.sendActivity('An error occurred. Please try again later.');
};

server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async (context) => {
    if (context.activity.type === 'message') {
      const text = context.activity.text.toLowerCase();
      if (text.includes('hello')) {
        await context.sendActivity('Hello! How can I assist you today?');
      } else {
        await context.sendActivity("I'm sorry, I don't understand.");
      }
    }
  });
});
