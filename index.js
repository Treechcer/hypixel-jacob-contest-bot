import { Client, Events, GatewayIntentBits, resolveSKUId } from 'discord.js';

import "dotenv/config"

import { initDB, addServer, sendMessageToAllChannels } from "./src/database.js";

const url = "https://jacobs.strassburger.dev/api/jacobcontests";

var globalResponse = false

const token = process.env.TOKEN_DS;
//const guildID = process.env.GUILD;

var time = 9999999999

var roles = {
    //name : id
}

var nextCrops = [ /* names ... */ ]

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

async function callAPI() {
    console.log("API CALLED!")
    const response = await fetch(url, {method : "GET"});
    if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
    }

    globalResponse = await response.json();
}

async function main() {
    try {
        if (!globalResponse || !globalResponse.length){
            await callAPI();
        }

            time = globalResponse[0].timestamp - new Date().getTime()

            nextCrops = globalResponse[0].cropNames;

            await sendMessageToAllChannels(nextCrops, globalResponse[0].timestamp)
        } 
        catch (error) {
            console.error(error.message);
        }

        roles = {}
        globalResponse.shift()

        console.log("Next Event is in: " + (globalResponse[0].timestamp - new Date().getTime() - (3 * 60 * 1000)) / (60 * 1000) + " minutes")

        //const channel = await client.channels.fetch("1474462322335420450");
        //
        //const data = await getData();
        //await channel.send(data);
}

async function run(){
    await main()
    setInterval(main, 1000 * 60 * 60 /*2000*/)
}

client.once(Events.ClientReady, async (readyClient) => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    await callAPI()
    //console.log(globalResponse[0])
    setTimeout(run,
        globalResponse[0].timestamp - new Date().getTime() < (3 * 60 * 1000) ? 1 : globalResponse[0].timestamp - new Date().getTime() - (3 * 60 * 1000) // this should notify ALWAYS areound 3 minutes before the event? Is this correct
    );
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
    }
    catch (err) {
        console.error("Error sending message:", err)
    }
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