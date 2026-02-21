import { Client, Events, GatewayIntentBits } from 'discord.js';

import "dotenv/config"

import { initDB, addServer, sendMessageToAllChannels } from "./src/database.js";

const token = process.env.TOKEN_DS;
//const guildID = process.env.GUILD;

let time = 9999999999

var roles = {
    //name : id
}

var nextCrops = [ /* names ... */ ]

//console.log(token)

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    setInterval(async() => {
        const url = "https://jacobs.strassburger.dev/api/jacobcontests";
        try {
            const response = await fetch(url, {method : "GET"});
            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const result = await response.json();
            console.log("Fetched contests, next timestamp:", result[0].timestamp);

            //console.log(result[0])  

            time = result[0].timestamp - new Date().getTime()

            //console.log(result[0].timestamp - new Date().getTime())

            nextCrops = result[0].cropNames;

            sendMessageToAllChannels(nextCrops, result[0].timestamp)
        } 
        catch (error) {
            console.error(error.message);
        }

        roles = {}

        //const channel = await client.channels.fetch("1474462322335420450");
        //
        //const data = await getData();
        //await channel.send(data);
    }, /*1000 * 60 * 20*/ 5000) // 20 minutes
});

export async function checkRoles(guildID, crops){
    const guild = client.guilds.cache.get(guildID);
    if (!guild) return;

    for (let i = 0; i < crops.length; i++) {
        let roleName = crops[i];

        let role = guild.roles.cache.find(x => x.name === roleName);

        if (!role) {
            role = await guild.roles.create({
                name: roleName,
                color: 0x00ff00,
                permissions: []
            });
        }
        roles[guildID] = roles[guildID] || {}
        roles[guildID][roleName] = role.id;
    }
}

export async function sendMessage(channelID, guildID, timestamp){
    let timeRemaining = timestamp - new Date().getTime();
    setTimeout(async() => {
        try{
            const channel = await client.channels.fetch(channelID);

            if (!channel) {
                console.log("Channel not found");
                return;
            }

            let msg = "Contest starts on <t:" + Math.floor(timestamp / 1000) + ":R> \n"
            for (let i = 0; i < nextCrops.length; i++){
                msg += "<@&" + roles[guildID][nextCrops[i]] + "> "
            }
            
            await channel.send(msg);
            console.log("Message sent");
        }
        catch (err) {
            console.error("Error sending message:", err)
        }
    }, (timeRemaining) < 180000 ? 1 : timeRemaining)
}

client.on("messageCreate", message => {
    if (message.author.bot) return;

    if (message.content.toUpperCase() === "JACOB SETUP") {     
        addServer(message.guildId, message.channelId);
        message.reply("Server added!");
    }
});

client.login(token);

initDB()