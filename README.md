# Personal whatsApp Assistant

This is a simple personal WhatsApp bot used to extend features of WhatsApp.

![NodeJs](https://img.shields.io/badge/v18.19.0-green?style=flat&logo=nodejs&logoColor=yellow&label=nodejs&color=yellow)
![NodeJs](https://img.shields.io/badge/v6.7.9-green?style=flat&logoColor=yellow&label=baileys&color=#0FCDA3)
## Features

- Retrives  deleted messages.
- Downloads view once images and videos sent in groups or PM.
- DOwnloads profile pictures of your contacts.
- You can download you text database (whatsapp.db).

## How to build this project

 1. Clone the repo

  ```sh
   git clone https://github.com/aspects19/auto388 
   ```

2. Navigate to the project

  ```sh
   cd auto388 
   ```

3. Install dependencies

  ```sh
   npm i 
   ```

4. Rename `.env.example` file to `.env` amd replace your phone number in it starting with the country code without the starting `+`
5. 🥳 Hooray, you're good to go, run  `npm start` to start the bot locally

## How to use the features of this bot

- Check if the bot is alive by texting yourself `.alive`
- Download your sqlite database file by teting yourself `.db`
- Download your contact's profile picture by texting yourself `.dp` followed by the contact with the country code eg `254` without `+`
- View once images and videos are downloaded as soon as someone replys to them and sent into your own number (it can also download already opened view once media)
- The above is also true when someone deletes a messages

## Uninplemented features reserved for future

- Download of media (images and videos when someone deletes for you)
- Prevention of multiple download of the view once media when it is replied to more than once

 This project uses the library [baileys](https://github.com/WhiskeySockets/Baileys).
 **WARNING** This tool is not affiliated with [WhatsApp Inc](https://whatsapp.com) and should be used for educational use only and may lead to bans if misused. 
