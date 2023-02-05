import { Guild } from "discord.js";
import DatabaseClient from "../clients/DatabaseClient";
import {
    generateKey,
    getBans,
    getChannels,
    getEmojis,
    getMembers,
    getRoles,
} from "./BackupUtils";
import { BackupData } from "./types";
import { CreateBackupOptions } from "./types/CreateBackup";
import { gzip } from "node-gzip";

export const getBackupData = (backup_id: string) => {
    return new Promise(async (resolve, reject) => {
        let backupData = await DatabaseClient.backups.findOne({ backup_id });
        if (backupData) {
            return resolve(backupData);
        } else {
            return reject("Invalid Backup Provided");
        }
    });
};

export const createBackup = async (
    guild: Guild,
    options: CreateBackupOptions = {
        maxMessagesPerChannel: 10,
        backupID: null,
        doNotBackup: [],
        overrideBackup: false,
        accountID: null,
    },
) => {
    return new Promise(async (resolve, reject) => {
        try {
            const backup = (await DatabaseClient.backups.findOne({
                guildID: guild.id,
            })) as BackupData;
            const backupID =
                options.overrideBackup && backup
                    ? backup.backup_id
                    : generateKey();
            const backupData: BackupData = {
                name: guild.name,
                verificationLevel: guild.verificationLevel,
                explicitContentFilter: guild.explicitContentFilter,
                defaultMessageNotifications: guild.defaultMessageNotifications,
                afk: guild.afkChannel
                    ? { name: guild.afkChannel.name, timeout: guild.afkTimeout }
                    : null,
                widget: {
                    enabled: guild.widgetEnabled,
                    channel: guild.widgetChannel
                        ? guild.widgetChannel.name
                        : null,
                },
                channels: {
                    categories: [],
                    others: [],
                },
                roles: [],
                bans: [],
                emojis: [],
                createdTimestamp: Date.now(),
                guildID: guild.id,
                backup_id: backupID,
                accountID: options.accountID,
                members: [],
            };
            if (guild.iconURL()) {
                backupData.iconURL = guild.iconURL({ dynamic: true });
            }
            if (guild.splashURL()) {
                backupData.bannerURL = guild.bannerURL();
            }

            if (!options || !(options.doNotBackup || []).includes("bans")) {
                // Backup bans
                backupData.bans = await getBans(guild);
            }
            if (!options || !(options.doNotBackup || []).includes("roles")) {
                // Backup roles
                backupData.roles = await getRoles(guild);
            }
            if (!options || !(options.doNotBackup || []).includes("emojis")) {
                // Backup emojis
                backupData.emojis = await getEmojis(guild);
            }
            if (!options || !(options.doNotBackup || []).includes("channels")) {
                // Backup channels
                backupData.channels = await getChannels(guild, options);
            }
            if (!options || !(options.doNotBackup || []).includes("members")) {
                // Backup channels
                backupData.members = await getMembers(guild, options);
            }

            if (backup && options.overrideBackup) {
                await DatabaseClient.backups.findOneAndUpdate(
                    {
                        guildID: guild.id,
                    },
                    backupData,
                );
            } else {
                await DatabaseClient.backups.create(backupData);
            }
            resolve(backupData);
        } catch (e) {
            console.log(e);
            return reject(e);
        }
    });
};
