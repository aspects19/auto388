const {
    makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
  } = require ("@whiskeysockets/baileys");
  
const pino = require("pino");    
  
  
  async function statusAutoView() {

    const { state, saveCreds } = await useMultiFileAuthState("./SESSION");
    const { version } = await fetchLatestBaileysVersion();

    const bot = makeWASocket({
        logger: pino({ level: "silent" }),
        version,
        printQRInTerminal: true,
        auth: state,
      });

    bot.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === "close") {
        var a, b;
        var shouldReconnect =
          ((b =
            (a = lastDisconnect.error) === null || a === void 0
              ? void 0
              : a.output) === null || b === void 0
            ? void 0
            : b.statusCode) !== DisconnectReason.loggedOut;
        console.log(
          "connection closed due to ",
          lastDisconnect.error,
          ", reconnecting ",
          shouldReconnect
        );
        if (shouldReconnect) {
          statusAutoView();
        }
      } else if (connection === "open") {
        console.log("Logged in successfully");
      }
    });
  

    bot.ev.on("creds.update", saveCreds);
  
    bot.ev.on("messages.upsert", async (m) => {
      m.messages.forEach(async (message) => {

        if (!message.message || message.message.ephemeralMessage)
          return;

        if (message.key.fromMe && message.message.conversation === "!post") {
          try {
            console.log("update got")
            bot.sendMessage('status@broadcast', {
              text: 'Hi my friends!' 
              }, {
              backgroundColor: '#315575',
              font: 3,
              statusJidList: ['254794141227@s.whatsapp.net', '254736590981@s.whatsapp.net']
              });
          } catch (err) {
              console.log(`error ${err} occured`)
          }
        }

        if (message.key && message.key.remoteJid == "status@broadcast") {
          setTimeout(async () => {
            try {
              await bot.readMessages([message.key]);
              user_name =  message.pushName
              console.log( (message.message.protocolMessage ? `\u2757 ${user_name} deleted their story` : `Viewed ${user_name}'s stories`));
            } catch (err) {
              console.error("Error reading messages:", err);
            }
          }, 2000);
        }
        
        if (message.key && message.message.conversation === "!allcontacts") {
          // and 
        }
      });
    });
  }


statusAutoView();

