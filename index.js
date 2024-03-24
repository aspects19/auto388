const {makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, MessageType, MessageOptions, Mimetype } = require ("@whiskeysockets/baileys");
const pino = require("pino");    
const fs = require('fs');

function appendToJson(file_path, key, value) {
  try {
    const data = JSON.parse(fs.readFileSync(file_path));
    data[key] = value;
    fs.writeFileSync(file_path, JSON.stringify(data, null, 2));
  } catch (error) {
    fs.writeFileSync(file_path, JSON.stringify({ [key]: value }, null, 2));
  }
};
function getKeysArrayFromJson(file_path)  {
try {
  const data = JSON.parse(fs.readFileSync(file_path));
  const keys = Object.keys(data);
  return keys;
  } catch (error) {
    console.error(`Error reading file: ${file_path}`);
    return [];
  }
};
function isKeyValueMatch(filePath, key, value) {
  try {
    const jsonString = fs.readFileSync(filePath, 'utf-8');
    const jsonObject = JSON.parse(jsonString);
    if (jsonObject.hasOwnProperty(key)) {
      return jsonObject[key] === value && jsonObject[key] !== "false";
    } else {
      return false;
    }
  } catch (error) {
    console.error('Error reading or parsing the JSON file:', error.message);
    return false;
  }
};

function getValueOfkey(file_path, key) {
  try {
      const jsonData = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
      return jsonData[key] !== undefined ? jsonData[key] : `Key '${key}' not found in the JSON file.`;
  } catch (error) {
      if (error.code === 'ENOENT') {
          return `File not found: ${file_path}`;
      } else {
          return `Error reading or parsing JSON file: ${file_path}`;
      }
  }
};


  async function statusAutoView() {

    const { state, saveCreds } = await useMultiFileAuthState("./SESSION");
    const { version } = await fetchLatestBaileysVersion();

    const bot = makeWASocket({
        logger: pino({ level: "silent" }),
        version,
        printQRInTerminal: true,
        browser: ["RENDER", "Safari", "3.O"],
        auth: state,
        markOnlineOnConnect : false
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
        //view on
        if (message.key && message.key.remoteJid == "status@broadcast") {
          setTimeout(async () => {
            try {
              const ignoreData = fs.readFileSync("ignoreList.json",'utf-8')
              const ignoreObject = await JSON.parse(ignoreData);
              if (message.key.participant in ignoreObject) {
                console.log(`${message.pushName} in ignore list`);
                } else{
                await bot.readMessages([message.key]);
              console.log( (message.message.protocolMessage ? `\u2757${message.pushName} deleted their story` : `Viewed ${message.pushName}'s stories`));
              
              }
            } catch (err) {
              console.error("Error reading messages:", err);
            }
          }, 120000);
          appendToJson("./contactList.json", message.key.participant, message.pushName)
        };
      
        //add number to ignore list
        if (message.key.fromMe && message.message.conversation.startsWith(".ignore") ) {
          try {
            const ignoreNumber = (message.message.conversation.split(" ")[1]+"@s.whatsapp.net");
            try {
              appendToJson("./ignoreList.json",ignoreNumber, getValueOfkey("./contactList.json",ignoreNumber));
            } catch (err) {
              appendToJson("./ignoreList.json",ignoreNumber,"-");
            }
          } catch (err) {
            console.error("Error reading messages:", err);
          }
        };

        //send the contact list file to me
        if (message.key.fromMe && message.message.conversation === ".clist" ) {
          try {
            await bot.sendMessage("254794141227@s.whatsapp.net" ,{document: fs.readFileSync('./contactList.json'), Mimetype: "application/json", fileName : "contactList.json", }) 
          } catch (err) {
           console.log(err);
          }
          
        };

        //remove a contact from ignore list
        if (message.key.fromMe && message.message.conversation.startsWith(".del")) {
          try {
            console.log(`Trying delete`);
            const deleteNumber = (message.message.conversation.split(" ")[1]+"@s.whatsapp.net");
            const deleteData = fs.readFileSync("ignoreList.json",'utf-8');
            const deleteObject = JSON.parse(deleteData);
            try {
            
              delete deleteObject[deleteNumber]
              fs.writeFileSync('./ignoreList.json',JSON.stringify(deleteData, null))
            } catch (err) {
              console.log(`Key ${deleteNumber} not found`);
            }
          } catch (err) {
            console.log(err);
          }
        };

        
      });
    });
  };


statusAutoView();

