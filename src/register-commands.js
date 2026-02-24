import { REST, Client } from "discord.js"
import { sendCommandsToAllServers } from "./database.js";

import "dotenv/config"

const commands = [
    {
        name : "setup",
        description : "This will set your server up so the bot will be sending messages for jacob contest."
    }
]

const rest = new REST({ version: "10", token: process.env.TOKEN_DS });

(async () => {
        try {
            //commands
            await sendCommandsToAllServers(commands, rest)
        }
        catch (error) {
            console.log(error)
        }
    }
)