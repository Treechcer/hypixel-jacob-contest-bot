import sqlite3 from 'sqlite3';
import { sendMessage, checkRoles } from "../index.js"

const db = new sqlite3.Database('./servers.db');

export function initDB(){
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

    if (new Date().getDay() == 0){
        db.each(`SELECT * FROM weeklyContests;`, async (err, row) => {
            db.run(`UPDATE weeklyContests set count = 0 where crop = ?`, [row.crop]);
        })
    }

    for (let i = 0; i < crops.length; i ++){
        let cropName = crops[i].replace(" ", "-").trim()
        //console.log("AAAA" + cropName)
        db.run(`INSERT OR IGNORE INTO weeklyContests VALUES(?,?)`, [cropName, 0])
        db.run(`UPDATE weeklyContests set count = count + 1 WHERE crop = ?`, [cropName])
    }
}