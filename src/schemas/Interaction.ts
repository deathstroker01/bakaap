import { Interaction } from "discord.js";
import { DiscordClient } from "./Client";

export interface DiscordInteraction extends Interaction {
    commandName: any;
    reply: any;
}
