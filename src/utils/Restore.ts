import { Guild } from "discord.js";
import { ungzip } from "node-gzip";
import { MemoryCache } from "../clients/MemoryCache";
import { getBackupData } from "./Backup";
import { clearGuild, loadChannel } from "./BackupUtils";
import {
    loadAFK,
    loadBans,
    loadChannels,
    loadConfig,
    loadEmbedChannel,
    loadEmojis,
    loadMemberRoles,
    loadRoles,
} from "./RestoreUtils";
import { BackupData } from "./types";
import { RestoreServerOptions } from "./types/RestoreServer";

export const startRestore = async (
    backup: string,
    guild: Guild | null,
    options: RestoreServerOptions = {
        maxMessagesPerChannel: 10,
    },
    cache?: MemoryCache,
) => {
    return new Promise(async (resolve, reject) => {
        if (!guild) {
            return reject("Invalid Guild");
        }

        try {
            let backupData: BackupData | any = await getBackupData(backup);

            try {
                await clearGuild(guild);
                await Promise.all([
                    loadConfig(guild, backupData),
                    loadRoles(guild, backupData, cache),
                    loadChannels(guild, backupData, options),
                    loadAFK(guild, backupData),
                    loadEmojis(guild, backupData),
                    loadBans(guild, backupData),
                    loadEmbedChannel(guild, backupData),
                    loadMemberRoles(guild, backupData, cache),
                ]);
            } catch (e) {
                console.error(e);
                return reject(e);
            }
            return resolve(backupData);
        } catch (e) {
            console.error(e);
            return reject("Invalid Backup");
        }
    });
};
