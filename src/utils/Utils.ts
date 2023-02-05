import { Client, MessageEmbed, MessageEmbedOptions } from "discord.js";
import { DiscordClient } from "../schemas/Client";
import { EmbedColors } from "./Emojis";

export const getBackupInterval = (input: string) => {
    switch (input) {
        case "1":
            return 21600;
        case "2":
            return 43200;
        case "3":
            return 86400;
        case "4":
            return 604800;
        default:
            return 86400;
    }
};

function makeid(length: number = 6) {
    var result = "";
    var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength),
        );
    }
    return result;
}

export const generateErrorCode = () => {
    return makeid();
};

export const generateEmbed = (
    components: MessageEmbedOptions,
    embed_type: "error" | "success" | "warn" | "unavailable",
) => {
    let colour;

    switch (embed_type) {
        case "error":
            colour = EmbedColors.red;
            return new MessageEmbed(components).setColor(colour);
        case "success":
            colour = EmbedColors.green;
            return new MessageEmbed(components).setColor(colour);
        case "unavailable":
            colour = EmbedColors.grey;
            return new MessageEmbed(components).setColor(colour);
        case "warn":
            colour = EmbedColors.yellow;
            return new MessageEmbed(components).setColor(colour);
        default:
            colour = EmbedColors.grey;
            return new MessageEmbed(components).setColor(colour);
    }
};
