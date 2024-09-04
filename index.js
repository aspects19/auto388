const {
  default: AMDConnect,
  useMultiFileAuthState,
  DisconnectReason,
  downloadMediaMessage,
  
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const Database = require('better-sqlite3');

const owner = "254794141227@s.whatsapp.net";

const db = new Database('whatsapp.db');
db.prepare(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    remoteJid TEXT,
    pushName TEXT,
    conversation TEXT,
    timestamp INTEGER
  )
`).run();

async function startAMD() {
  console.log('Script Online...');
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const AMD = AMDConnect({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    auth: state,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: true,
    syncFullHistory: true,
  });

  AMD.ev.on("messages.upsert", async (chatUpdate) => {
    try {
      const m = chatUpdate.messages[0];
      
      if (!m) return;
      if (m.key.remoteJid=="status@broadcast") return;
      if (m.key.remoteJid.endsWith("g.us")) return;

      if (m.message.viewOnceMessageV2) {
        
        const buffer = await downloadMediaMessage (
          m, 
          'buffer', {}, {
            logger: pino(),
            reuploadRequest: AMD.updateMediaMessage
          }
        )
          
        await AMD.sendMessage(
          owner, 
            (m.message.viewOnceMessageV2.message.videoMessage) ? {video: buffer}: {image: buffer}
          
        )
        
      };

      if (m.key.fromMe && m.message?.extendedTextMessage?.text == ".db" ) {
        try {
          await AMD.sendMessage(owner ,{document: fs.readFileSync('./whatsapp.db'), Mimetype: "application/x-sqlite3", fileName : "whatsapp.db", }) 
        } catch (err) {
         console.log(err);
        }
        
      };

      if (m.key.fromMe && m.message?.extendedTextMessage?.text?.startsWith(".dp")) {
        const jid = m.message.extendedTextMessage.text.split(" ")[1]+"@s.whatsapp.net";
        
        const url = await AMD.profilePictureUrl(jid, 'image');
        await AMD.sendMessage(owner, { 
          image: { url: url }, 
          mimetype: "image/jpeg",
        });
        
      };

      if (m.key.remoteJid.endsWith("@s.whatsapp.net") && m.message.conversation !=='' && !m.key.fromMe) {
        const messageData = {
          remoteJid: m.key.remoteJid,
          id: m.key.id,
          pushName: m.pushName,
          conversation: m.message?.conversation || '',
          timestamp: m.messageTimestamp, 
        };

        const insert = db.prepare(`
          INSERT INTO messages (id, remoteJid, pushName, conversation, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `);
        insert.run(messageData.id, messageData.remoteJid, messageData.pushName, messageData.conversation, messageData.timestamp);
      }

      if (m.message.protocolMessage) {
        const deletedId = m.message.protocolMessage.key.id;
        const deletedMessage = db.prepare(`
          SELECT * FROM messages WHERE id = ?
        `).get(deletedId);

        if (deletedMessage) {
          AMD.sendMessage(owner,{text :`*${deletedMessage.pushName} deleted* \n${deletedMessage.conversation}` })
        } else {
          console.log('No message found with ID:', deletedId);
        }
      }
      
    } catch (err) {
      console.log('Error:', err);
    }
  });

  AMD.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      let reason = lastDisconnect.error
        ? lastDisconnect?.error?.output.statusCode
        : 0;
      if (reason === DisconnectReason.badSession) {
        console.log(`Bad Session File, Please Delete Session and Scan Again`);
        process.exit();
      } else if (reason === DisconnectReason.connectionClosed) {
        console.log("Connection closed, reconnecting....");
        startAMD();
      } else if (reason === DisconnectReason.connectionLost) {
        console.log("Connection Lost from Server, reconnecting...");
        startAMD();
      } else if (reason === DisconnectReason.connectionReplaced) {
        console.log(
          "Connection Replaced, Another New Session Opened, Please Close Current Session First"
        );
        process.exit();
      } else if (reason === DisconnectReason.loggedOut) {
        console.log(`Device Logged Out, Please Delete Session and Scan Again.`);
        process.exit();
      } else if (reason === DisconnectReason.restartRequired) {
        console.log("Restart Required, Restarting...");
        startAMD();
      } else if (reason === DisconnectReason.timedOut) {
        console.log("Connection TimedOut, Reconnecting...");
        startAMD();
      } else {
        console.log(`Unknown DisconnectReason: ${reason}|${connection}`);
      }
    }
  });

  AMD.ev.on("creds.update", saveCreds);

  return AMD;
};

startAMD();
