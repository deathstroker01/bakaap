import { SlashCommandBuilder } from "@discordjs/builders";
import {
    CommandInteraction,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessageSelectMenu,
} from "discord.js";
import DatabaseClient from "../clients/DatabaseClient";
import {
    fetchPremiumBackupLimit,
    fetchPremiumMessagesCap,
} from "../utils/PremiumUtils";
import { CommandType } from "../utils/CommandType";
import { hasAdmin } from "../utils/Permissions";
import { MemoryCache } from "../clients/MemoryCache";
import { DiscordClient } from "../schemas/Client";

const Payload: CommandType = {
    data: new SlashCommandBuilder()
        .setName("backup")
        .setDescription("Create a backup of your server."),
    dms: false,
    async execute(
        interaction: CommandInteraction,
        client: DiscordClient,
        cache: MemoryCache,
    ) {
        await interaction.deferReply({
            ephemeral: true,
        });

        if (interaction.user.id !== process.env.OWNER_ID) {
            console.log(interaction.user.id, process.env.OWNER_ID);
            return interaction.editReply({
                content: "You do not have permission to use this command.",
            });
        }

        const row = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId(`backup_options_${interaction.guild?.id}`)
                .setPlaceholder("Select what you want to backup.")
                .setMinValues(1)
                .setMaxValues(7)
                .addOptions([
                    {
                        label: "Channels",
                        description:
                            "This will backup every channel, including voice, categories and text.",
                        value: "channels",
                        default: true,
                    },
                    {
                        label: "Roles",
                        description: "This will backup every role",
                        value: "roles",
                        default: true,
                    },
                    {
                        label: "Messages",
                        description:
                            "This will backup messages in every channel",
                        value: "messages",
                        default: true,
                    },
                    {
                        label: "Emojis",
                        description: "This will backup every emoji",
                        value: "emojis",
                        default: true,
                    },
                    {
                        label: "Bans",
                        description: "This will backup every ban",
                        value: "bans",
                        default: true,
                    },
                    {
                        label: "Overwrite",
                        description: "This will overwrite any previous backups",
                        value: "overwrite",
                        default: false,
                    },
                    {
                        label: "Member Roles + Nicknames",
                        description:
                            "This will backup member roles and nicknames",
                        value: "members",
                        default: false,
                        emoji: "⭐",
                    },
                ]),
        );

        cache.setItem(
            `premium_level_${interaction.guildId}`,
            JSON.stringify({
                level: 3,
            }),
        );

        const buttons = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId(`start_backup_${interaction.guild?.id}`)
                .setLabel("Start Backup")
                .setStyle("SUCCESS"),
            new MessageButton()
                .setCustomId(`cancel_backup_${interaction.guild?.id}`)
                .setLabel("Cancel Backup")
                .setStyle("DANGER"),
        );

        const embed = new MessageEmbed().setTitle("Backup Options")
            .setDescription(`
Below you can customize how you can backup your server.\nPress the **Start Backup** to start backing up or press **Cancel Backup** to cancel it.
        `);

        await interaction.editReply({
            embeds: [embed],
            components: [row, buttons],
        });
    },
};

export default Payload;
