import { Client } from "discord.js";
import fs from "fs";
import { DiscordClient } from "../schemas/Client";
import { production } from "../start";

export async function ready(this: DiscordClient) {
    console.log("[BOT] Logged into discord as ", this.user?.username);

    const commands = [];

    const commandFiles = fs
        .readdirSync(
            process.env.NODE_ENV === "production"
                ? "./dist/commands"
                : "./src/commands",
        )
        .filter((file) =>
            file.endsWith(
                process.env.NODE_ENV === "production" ? ".js" : ".ts",
            ),
        );

    for (const file of commandFiles) {
        const cmd = require(`../commands/${file}`);
        this.commands.set(cmd.default.data.name, cmd.default);
        commands.push(cmd.default.data.toJSON());
    }

    console.log("[Commands] Loading commands. Production: ", production);

    try {
        await this.application?.commands.set(commands);
        console.log(
            `[Commands] Successfully loaded ${commands.length} commands.`,
        );
    } catch (e) {
        console.error(`[Commands] Failed to load ${commands.length} commands.`);
        console.error(e);
    }
}
