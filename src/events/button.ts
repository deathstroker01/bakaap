import {
    ButtonInteraction,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
} from "discord.js";
import { DoNotBackupOptions } from "../utils/types";
import DatabaseClient from "../clients/DatabaseClient";
import { MemoryCache } from "../clients/MemoryCache";
import { createBackup } from "../utils/Backup";
import {
    fetchPremiumBackupLimit,
    fetchPremiumMessagesCap,
} from "../utils/PremiumUtils";

export async function button(
    interaction: ButtonInteraction,
    cache: MemoryCache,
) {
    if (!interaction.customId.includes("start_backup")) return;
    await interaction.deferReply({
        ephemeral: true,
    });
    const availableOptions: DoNotBackupOptions[] = [
        "bans",
        "channels",
        "emojis",
        "messages",
        "roles",
        "members",
    ];

    const guildId = interaction.customId.split("start_backup_")[1];
    const guild = interaction.client.guilds.cache?.get(guildId);
    const options = (await cache.getItem(
        `backup_options_${guildId}`,
    )) as string;

    const parsed = options
        ? JSON.parse(String(options))
        : {
              options: availableOptions,
          };

    let doNotBackup: Array<string | null> = availableOptions.map(
        (option: string) => {
            if (!parsed.options.includes(option)) {
                return option;
            } else {
                return null;
            }
        },
    );

    doNotBackup = doNotBackup.filter((el) => el !== null);

    if (!guild) return;

    console.log("creating backup?");

    createBackup(guild, {
        doNotBackup,
        maxMessagesPerChannel: fetchPremiumMessagesCap(3),
        backupID: null,
        accountID: interaction.user.id,
        overrideBackup: parsed.options.includes("overwrite"),
        cache: cache,
    }).then((backup) => {
        return interaction.editReply({
            embeds: [
                new MessageEmbed()
                    .setTitle("Backed Up Server")
                    .setDescription(
                        `We have successfully backed up your server.\nYour backup will be linked to your main discord account`,
                    )
                    .setFooter({ text: "Letoa" })
                    .setTimestamp(),
            ],
        });
    });
}
