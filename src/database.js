import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./servers.db');

export function initDB(){
    db.run("create table if not EXISTS test(guildID INTEGER PRIMARY KEY, channelID integer);");
}

export function addServer(guilID, channelID){
    db.run(`INSERT INTO test VALUES(${guilID}, ${channelID});`);
}

