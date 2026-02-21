import sqlite3 from 'sqlite3';
import { sendMessage, checkRoles } from "../index.js"

const db = new sqlite3.Database('./servers.db');

export function initDB(){
    db.run(`create table if not EXISTS servers(
        guildID TEXT PRIMARY KEY UNIQUE NOT NULL,
        channelID TEXT
    );`);
}

export function addServer(guilID, channelID){
    db.run(`INSERT OR REPLACE INTO servers VALUES(?, ?);`, [guilID, channelID]);
}

export function sendMessageToAllChannels(crops, timestamp){
    db.each(`SELECT * FROM servers;`, async (err, row) => {
        if (err) {
            console.error(err);
            return;
        }

        console.log(`Sending to guild ${row.guildID}, channel ${row.channelID}`);
        await checkRoles(row.guildID, crops);
        await sendMessage(row.channelID, row.guildID, timestamp);
    });
}