const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');
const express = require('express');
require('dotenv').config();

// Keep-alive server for Render
const app = express();
app.get('/', (req, res) => res.send('Bot is running!'));
app.listen(process.env.PORT || 3000, () => console.log('Keep-alive server started'));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('getid')
    .setDescription('Get your Discord ID'),

  new SlashCommandBuilder()
    .setName('idinfo')
    .setDescription('Get info for IDs')
    .addStringOption(option =>
      option.setName('ids')
        .setDescription('Space-separated list of IDs')
        .setRequired(true))
].map(cmd => cmd.toJSON());

// Register commands globally
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Slash commands registered.');
  } catch (error) {
    console.error(error);
  }
})();

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Handle interactions
client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton() && interaction.customId === 'get_my_id') {
    await interaction.reply({
      content: `Your Discord ID: **${interaction.user.id}**`,
      ephemeral: true
    });
  }

  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'getid') {
      await interaction.reply({
        content: `Your Discord ID: **${interaction.user.id}**`,
        ephemeral: true
      });
    }

    if (interaction.commandName === 'idinfo') {
      const ids = interaction.options.getString('ids').split(/\s+/);
      let response = '';

      for (const id of ids) {
        try {
          const member = await interaction.guild.members.fetch(id);
          if (member) {
            response += `<@${id}>\n`;
          }
        } catch (err) {
          response += `User ${id} not present in server, maybe left or was removed/banned\n`;
        }
      }

      await interaction.reply(response);
    }
  }
});

// Send preset button message (run once)
client.on('ready', async () => {
  const channelId = process.env.CHANNEL_ID;
  const channel = await client.channels.fetch(channelId);

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('get_my_id')
        .setLabel('Get My ID')
        .setStyle(ButtonStyle.Primary)
    );

  channel.send({ content: 'Click below to get your ID:', components: [row] });
});

// Extra logging and error handling
client.on('debug', console.log);
client.on('warn', console.warn);
client.on('error', console.error);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

client.on('shardDisconnect', (event, shardId) => {
  console.error(`Shard ${shardId} disconnected:`, event);
});

client.on('shardReconnecting', (shardId) => {
  console.log(`Shard ${shardId} reconnecting...`);
});

client.on('shardResume', (shardId, replayedEvents) => {
  console.log(`Shard ${shardId} resumed, replayed ${replayedEvents} events.`);
});

client.login(process.env.TOKEN);
