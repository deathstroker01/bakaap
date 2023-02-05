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
import { getBackupInterval } from "../utils/Utils";

const Payload: any = {
    data: new SlashCommandBuilder()
        .setName("intervals")
        .setDescription("Configure your backup intervals")
        .addSubcommand((sub) =>
            sub
                .setName("set")
                .setDescription("Set your backup interval")
                .addStringOption((option) =>
                    option
                        .setName("time")
                        .setDescription(
                            "How often do you want your server backed up.",
                        )
                        .setRequired(true)
                        .addChoice("6 Hours", "1")
                        .addChoice("12 Hours", "2")
                        .addChoice("1 Day", "3")
                        .addChoice("7 Days", "4"),
                ),
        )
        .addSubcommand((sub) =>
            sub
                .setName("disable")
                .setDescription("Disable your backup interval"),
        )
        .addSubcommand((sub) =>
            sub
                .setName("enable")
                .setDescription("Re-enable your backup interval"),
        ),
    dms: false,
    async execute(interaction: CommandInteraction) {
        if (interaction.user.id !== process.env.OWNER_ID) {
            console.log(interaction.user.id, process.env.OWNER_ID);
            return interaction.editReply({
                content: "You do not have permission to use this command.",
            });
        }
        const intervals = await DatabaseClient.getInterval({
            id: interaction.guild?.id,
        });
        const sub = interaction.options.getSubcommand();

        if (sub === "set") {
            const time = getBackupInterval(
                interaction.options.getString("time", true),
            );

            await DatabaseClient.intervals.findOneAndUpdate(
                {
                    id: interaction.guild?.id,
                },
                {
                    enabled: true,
                    interval: time,
                    lastBackup: Date.now(),
                },
            );

            const date = new Date();
            date.setSeconds(date.getSeconds() + time);

            return await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Letoa Success")
                        .setDescription(
                            "We have successfully configured your backup interval settings.",
                        )
                        .addField(
                            "Next Backup",
                            `Your next backup will be made <t:${Math.floor(
                                date.getTime() / 1000,
                            )}>`,
                        ),
                ],
            });
        } else if (sub === "disable") {
            await DatabaseClient.intervals.findOneAndUpdate(
                {
                    id: interaction.guild?.id,
                },
                {
                    enabled: false,
                },
            );

            return await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Letoa Success")
                        .setDescription(
                            "We have successfully disabled your backup interval.",
                        ),
                ],
            });
        } else if (sub === "enable") {
            await DatabaseClient.intervals.findOneAndUpdate(
                {
                    id: interaction.guild?.id,
                },
                {
                    enabled: true,
                },
            );

            return await interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle("Letoa Success")
                        .setDescription(
                            "We have successfully enabled your backup interval.",
                        ),
                ],
            });
        } else return;
    },
};

export default Payload;
