const { Client, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const token = process.env.TOKEN_DS;
const guildID = process.env.GUILD;

var roles = {
    //name : id
}

var nextCrops = [ /* names ... */ ]

console.log(token)

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

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
            console.log(result);

            console.log(result[0].timestamp - new Date().getTime())

            let time = result[0].timestamp - new Date().getTime()

            const guild = client.guilds.cache.get(guildID);
            if (!guild) return;

            for (let i = 0; i < result[0].cropNames.length; i++) {
                let roleName = result[0].cropNames[i];

                let role = guild.roles.cache.find(x => x.name === roleName);

                if (!role) {
                    role = await guild.roles.create({
                        name: roleName,
                        color: 0x00ff00,
                        permissions: []
                    });
                }

                roles[roleName] = role.id;
            }

            //console.log(result[0])

            nextCrops = result[0].cropNames;

            setTimeout(async() => {
                console.log("!!!!!")
                const channel = await client.channels.fetch("1474462322335420450");
                let msg = ""
                for (let i = 0; i < nextCrops.length; i++){
                    msg += "<@&" + roles[nextCrops[i]] + "> "
                }

                await channel.send(msg);
            }, (time) < 180000 ? 1 : time)
        } 
        catch (error) {
            console.error(error.message);
        }

        //const channel = await client.channels.fetch("1474462322335420450");
        //
        //const data = await getData();
        //await channel.send(data);
    }, 1000 * 60 * 20) // 20 minutes
});

client.login(token);

