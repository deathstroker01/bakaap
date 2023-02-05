process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

import { Bot } from "./bot";
import { config } from "dotenv";
import { Intents, ShardingManager } from "discord.js";
import HttpsProxyAgent from "https-proxy-agent";
config();

export const production = false;

const client = new Bot({
    token: process.env.BOT_TOKEN,
    production,
    options: {
        intents: [
            Intents.FLAGS.GUILDS,
            Intents.FLAGS.GUILD_MEMBERS,
            Intents.FLAGS.GUILD_MESSAGES,
        ],
        shards: "auto",
        presence: {
            status: "idle",
            activities: [
                {
                    type: "WATCHING",
                    name: "Loading up. Please wait.",
                },
            ],
        },
    },
});

client.start();
