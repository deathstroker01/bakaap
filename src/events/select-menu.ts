import {
    MessageActionRow,
    MessageButton,
    MessageEmbed,
    MessageSelectMenu,
    SelectMenuInteraction,
} from "discord.js";
import DatabaseClient from "../clients/DatabaseClient";
import { fetchPremiumMessagesCap } from "../utils/PremiumUtils";
import { startRestore } from "../utils/Restore";
import { MemoryCache } from "../clients/MemoryCache";
import { generateErrorCode } from "../utils/Utils";

export async function selectMenuHandler(
    interaction: SelectMenuInteraction,
    cache: MemoryCache,
) {
    const isMenu = interaction.customId.includes("backup_options");
    await interaction.deferUpdate();

    switch (isMenu) {
        case true:
            const values = interaction.values;
            if (await cache.getItem(interaction.customId)) {
                await cache.deleteItem(interaction.customId);
                await cache.setItem(
                    interaction.customId,
                    JSON.stringify({
                        options: values,
                    }),
                );
            } else {
                await cache.setItem(
                    interaction.customId,
                    JSON.stringify({
                        options: values,
                    }),
                );
            }

            const prem = await cache.getItem(
                `premium_level_${interaction.guildId}`,
            );

            const premiumLevel = 3;

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
                            default: values.includes("channels"),
                        },
                        {
                            label: "Roles",
                            description: "This will backup every role",
                            value: "roles",
                            default: values.includes("roles"),
                        },
                        {
                            label: "Messages",
                            description:
                                "This will backup messages in every channel",
                            value: "messages",
                            default: values.includes("messages"),
                        },
                        {
                            label: "Emojis",
                            description: "This will backup every emoji",
                            value: "emojis",
                            default: values.includes("emojis"),
                        },
                        {
                            label: "Bans",
                            description: "This will backup every ban",
                            value: "bans",
                            default: values.includes("bans"),
                        },
                        {
                            label: "Overwrite",
                            description:
                                "This will overwrite any previous backups",
                            value: "overwrite",
                            default: values.includes("overwrite"),
                        },
                        {
                            label: "Member Roles + Nicknames",
                            description:
                                "This will backup member roles and nicknames",
                            value: "members",
                            emoji: "⭐",
                            default: values.includes("members"),
                        },
                    ]),
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

            await interaction.editReply({
                components: [row, buttons],
            });
            break;
        case false:
            if (interaction.customId.includes("restore_server")) {
                const backup_id = interaction.values[0];
                if (!backup_id) return;
                if (!interaction.guild) return;

                console.log(fetchPremiumMessagesCap(3));

                startRestore(
                    backup_id,
                    interaction.guild,
                    {
                        maxMessagesPerChannel: fetchPremiumMessagesCap(3),
                    },
                    cache,
                )
                    .then(async () => {
                        try {
                            interaction.user.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setTitle("Restoring Your Server!")
                                        .setDescription(
                                            "We are currently restoring your server.\nIf you have a higher premium plan, it may take longer to restore all the messages.",
                                        )
                                        .setImage(
                                            "https://cdn.letoa.me/letoa_rewrite.png",
                                        )
                                        .setTimestamp()
                                        .setFooter({ text: "Letoa" }),
                                ],
                            });
                        } catch (e) {}
                    })
                    .catch(async (e) => {
                        try {
                            interaction.user.send({
                                embeds: [
                                    new MessageEmbed()
                                        .setTitle("We have ran into an error!")
                                        .setDescription(
                                            `Sorry but we ran into an error!\n${e}`,
                                        )
                                        .setImage(
                                            "https://cdn.letoa.me/letoa_rewrite.png",
                                        )
                                        .setTimestamp()
                                        .setFooter({ text: "Letoa" }),
                                ],
                            });
                        } catch (e) {
                            // TODO: Send a message to the first channel pinging the user?
                        }
                    });

                break;
            }
    }
}
