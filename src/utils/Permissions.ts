import { CommandInteraction, Permissions } from "discord.js";

export const hasAdmin = (interaction: CommandInteraction): boolean => {
    if (interaction.memberPermissions?.has(Permissions.FLAGS.ADMINISTRATOR)) {
        return true;
    } else {
        return false;
    }
};
