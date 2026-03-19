const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');

// Keep-alive server so Render detects a port
const app = express();
app.get('/', (req, res) => res.send('Bot test running!'));
app.listen(process.env.PORT || 3000, () => console.log('Keep-alive server started'));

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('error', (err) => {
    console.error('❌ Client error:', err);
});

client.login(process.env.TOKEN);
