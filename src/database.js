import sqlite3 from 'sqlite3';
import { sendMessage, checkRoles } from "../index.js"
import { Routes } from "discord.js"

const db = new sqlite3.Database('./servers.db');

export function initDB(){
    const db = new sqlite3.Database('./servers.db');
    db.run(`create table if not EXISTS servers(
        guildID TEXT PRIMARY KEY UNIQUE NOT NULL,
        channelID TEXT
    );`);

    db.run(`create table if not EXISTS weeklyContests(
        crop TEXT PRIMARY KEY UNIQUE NOT NULL,
        count INTEGER
    );`);
}

export function addServer(guilID, channelID){
    db.run(`INSERT OR REPLACE INTO servers VALUES(?, ?);`, [guilID, channelID]);
}

export async function sendCommandsToAllServers(commands, rest) {
    console.log(commands);
    console.log("?")
    
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM servers;`, async (err, rows) => {
            if (err) {
                console.error(err);
                reject(err);
                return;
            }
            
            for (const row of rows) {
                try {
                    await rest.put(
                        Routes.applicationGuildCommands(process.env.BOT_ID, row.guildID),
                        { body: commands }
                    );
                    console.log(`Commands registered for guild ${row.guildID}`);
                } catch (error) {
                    console.error(`Failed to register commands for guild ${row.guildID}:`, error);
                }
            }
            resolve();
        });
    });
}

export async function sendMessageToAllChannels(crops, timestamp){
    db.each(`SELECT * FROM servers;`, async (err, row) => {
        console.log("sending message guild " + row.guildID);
        if (err) {
            console.error(err);
            return;
        }

        await checkRoles(row.guildID, crops);
        await sendMessage(row.channelID, row.guildID, timestamp);
    });

    //TODO: Correct this
    //if (new Date().getDay() == 0){
    //    db.each(`SELECT * FROM weeklyContests;`, async (err, row) => {
    //        db.run(`UPDATE weeklyContests set count = 0 where crop = ?`, [row.crop]);
    //    })
    //}

    for (let i = 0; i < crops.length; i ++){
        let cropName = crops[i].replace(" ", "-").trim()
        //console.log("AAAA" + cropName)
        db.run(`INSERT OR IGNORE INTO weeklyContests VALUES(?,?)`, [cropName, 0])
        db.run(`UPDATE weeklyContests set count = count + 1 WHERE crop = ?`, [cropName])
    }
}