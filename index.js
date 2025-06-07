const { default: makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs');

// Hifadhi na soma session
const { state, saveState } = useSingleFileAuthState('./creds.json');

async function startBot() {
  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      console.log('❌ Connection closed, reconnecting...', lastDisconnect?.error?.message);
      startBot(); // retry
    } else if (connection === 'open') {
      console.log('✅ Bot imeunganishwa na WhatsApp!');
      console.log(`255623672733: ${sock.user.id}`);
    }
  });

  const getContent = (msg) => {
    const m = msg.message;
    if (!m) return '';
    if (m.conversation) return m.conversation;
    if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
    if (m.imageMessage?.caption) return m.imageMessage.caption;
    if (m.videoMessage?.caption) return m.videoMessage.caption;
    if (m.buttonsResponseMessage?.selectedButtonId) return m.buttonsResponseMessage.selectedButtonId;
    return '';
  };

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid;
    const text = getContent(msg).toLowerCase().trim();

    let reply = '';

    switch (text) {
      case 'huduma':
        reply = `👋 Karibu Prince Lowe Bot wa Biashara!

📌 Huduma zangu:
1. 🤖 Kutengeneza Bot
2. 🌐 Kutengeneza Website
3. 🚀 Kudeploy Bot
4. 💼 Bot za Biashara

Tuma namba *1*, *2*, *3*, au *4* kujifunza zaidi.`;
        break;
      case '1':
        reply = `🤖 Huduma ya Kutengeneza Bot:
Ninatengeneza bot zinazojibu moja kwa moja WhatsApp kwa biashara yako.`;
        break;
      case '2':
        reply = `🌐 Huduma ya Website:
Ninatengeneza tovuti kwa ajili ya biashara yako — kwa bei nafuu na kasi ya kisasa.`;
        break;
      case '3':
        reply = `🚀 Huduma ya Kudeploy Bot:
Nasaidia kuweka bot yako online 24/7 kwa Render, Heroku au VPS.`;
        break;
      case '4':
        reply = `💼 Bot za Biashara:
Bot inayojibu wateja, kutoa huduma, taarifa na maelezo — 100% moja kwa moja.`;
        break;
      default:
        reply = `👋 Karibu kwenye PRINCE LOWE BOT\nTuma *huduma* kuona huduma zangu.`;
    }

    await sock.sendMessage(sender, { text: reply });
  });
}

startBot();
