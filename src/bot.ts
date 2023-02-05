import { italic } from "@discordjs/builders";
import { throws } from "assert";
import {
    Client,
    ClientOptions,
    Collection,
    Intents,
    Interaction,
    MessageEmbed,
} from "discord.js";
import DatabaseClient from "./clients/DatabaseClient";
import { MemoryCache } from "./clients/MemoryCache";
import { button } from "./events/button";
import { ready } from "./events/ready";
import { selectMenuHandler } from "./events/select-menu";
import { DiscordClient } from "./schemas/Client";
import { DiscordInteraction } from "./schemas/Interaction";
import { createBackup } from "./utils/Backup";
import { EmbedColors, Emojis } from "./utils/Emojis";
import { Logging } from "./utils/Logging";
import { fetchPremiumMessagesCap } from "./utils/PremiumUtils";

export class Bot {
    public token: string | undefined;
    public client: DiscordClient;
    public production: boolean;
    public logging: Logging;
    public cache: MemoryCache;

    constructor({
        token,
        production,
        client,
        options,
    }: {
        token: string | undefined;
        production?: boolean;
        client?: DiscordClient;
        options?: ClientOptions;
    }) {
        this.token = token;
        this.production = production || false;

        if (
            typeof options !== "object" ||
            (typeof options === "object" && !options.intents)
        )
            throw new Error("`Intents` must be declared in options.");

        if (client) this.client = client;
        else this.client = new DiscordClient(options);

        this.cache = new MemoryCache({});

        this.client.on("debug", async (msg) => {
            this.logging = new Logging({ file: "logs/logs.log" });
            if (this.production) {
                this.logging.writeToLog(
                    `[${new Date().toUTCString()}] [DEBUG] ${msg}`,
                );
                console.log(`[DEBUG] ${msg}`);
            } else
                this.logging.writeToLog(
                    `[${new Date().toUTCString()}] [DEBUG] ${msg}`,
                );
        });

        this.client.on("shardReady", (shardId) => {
            this.client.user?.setPresence({
                activities: [
                    {
                        name: `letoa.me | /help | Shard: ${shardId}`,
                        type: "LISTENING",
                    },
                ],
                shardId,
                status: "online",
            });
        });

        this.client.on("ready", ready);

        this.client.on(
            "interactionCreate",
            async (interaction: Interaction) => {
                if (interaction.isButton()) {
                    if (interaction.customId.includes("cancel_backup")) {
                        return await interaction.reply({
                            content: "Cancelled Backup.",
                        });
                    } else {
                        return button(interaction, this.cache);
                    }
                }
                if (interaction.isSelectMenu())
                    return selectMenuHandler(interaction, this.cache);

                // @ts-ignore
                if (!this.client.commands.has(interaction.commandName)) return;

                const command = this.client.commands.get(
                    // @ts-ignore
                    interaction.commandName,
                );

                if (!command.dms && !interaction.guild?.id) {
                    // @ts-ignore
                    return await interaction.reply({
                        content:
                            "This command may not be used in `Direct Messages`. Please use it in a server.",
                        ephemeral: true,
                    });
                }

                try {
                    await command.execute(interaction, this.client, this.cache);
                    this.logging.writeToLog(
                        `[${new Date().toUTCString()}] -- [COMMAND RAN] ${
                            // @ts-ignore
                            interaction.commandName
                        } was ran by ${interaction.user.tag}`,
                    );
                } catch (e) {
                    console.error(e);
                    // @ts-ignore
                    await interaction.reply({
                        content:
                            "There was an error while executing this command!",
                        ephemeral: true,
                    });
                }
            },
        );
    }

    async startIntervallingBackups() {
        setInterval(async () => {
            const backups = await DatabaseClient.intervals.find({
                enabled: true,
            });
            for (let backup of backups) {
                const guild = this.client.guilds.cache.get(backup.id);
                if (!guild) {
                    await DatabaseClient.intervals.findOneAndUpdate(
                        {
                            id: backup.id,
                        },
                        { enabled: false },
                    );
                    continue;
                }

                const time = Date.now();
                if (!backup.lastBackup) continue;
                const temp = new Date(backup.lastBackup);
                temp.setSeconds(temp.getSeconds() + backup.interval);

                if (temp.getTime() >= time) {
                    await DatabaseClient.intervals.findOneAndUpdate(
                        {
                            id: backup.id,
                        },
                        { lastBackup: Date.now() },
                    );
                    createBackup(guild, {
                        doNotBackup: [],
                        maxMessagesPerChannel: fetchPremiumMessagesCap(3),
                        backupID: null,
                        accountID: process.env.OWNER_ID ?? "",
                        overrideBackup: true,
                        cache: this.cache,
                    })
                        .then(() => {
                            console.log(
                                `[AUTO BACKUP] Created a backup successfully for the guild: ${guild.name} - ${guild.id}`,
                            );
                        })
                        .catch(() => {});
                }
            }
        }, 15 * 60000);
    }

    async start(): Promise<void> {
        DatabaseClient.connect().then(() => {
            this.startIntervallingBackups();
        });
        if (this.client.isReady() !== true) {
            await this.client.login(this.token);
        }
    }

    async stop() {
        this.client.destroy();
    }
}
