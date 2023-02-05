import type { BackupData, RestoreServerOptions } from "./types";
import {
    Collection,
    Emoji,
    Guild,
    GuildChannel,
    Role,
    RoleResolvable,
    Snowflake,
    VoiceChannel,
} from "discord.js";
import { loadCategory, loadChannel } from "./BackupUtils";
import { MemoryCache } from "../clients/MemoryCache";

/**
 * Restores the guild configuration
 */
export const loadConfig = (
    guild: Guild,
    backupData: BackupData,
): Promise<Guild[]> => {
    const configPromises: Promise<Guild>[] = [];
    if (backupData.name) {
        configPromises.push(guild.setName(backupData.name));
    }
    if (backupData.iconBase64) {
        configPromises.push(
            guild.setIcon(Buffer.from(backupData.iconBase64, "base64")),
        );
    } else if (backupData.iconURL) {
        configPromises.push(guild.setIcon(backupData.iconURL));
    }
    if (backupData.splashBase64) {
        configPromises.push(
            guild.setSplash(Buffer.from(backupData.splashBase64, "base64")),
        );
    } else if (backupData.splashURL) {
        configPromises.push(guild.setSplash(backupData.splashURL));
    }
    if (backupData.bannerBase64) {
        configPromises.push(
            guild.setBanner(Buffer.from(backupData.bannerBase64, "base64")),
        );
    } else if (backupData.bannerURL) {
        configPromises.push(guild.setBanner(backupData.bannerURL));
    }
    if (backupData.verificationLevel) {
        configPromises.push(
            guild.setVerificationLevel(backupData.verificationLevel),
        );
    }
    if (backupData.defaultMessageNotifications) {
        configPromises.push(
            guild.setDefaultMessageNotifications(
                backupData.defaultMessageNotifications,
            ),
        );
    }
    const changeableExplicitLevel = guild.features.includes("COMMUNITY");
    if (backupData.explicitContentFilter && changeableExplicitLevel) {
        configPromises.push(
            guild.setExplicitContentFilter(backupData.explicitContentFilter),
        );
    }
    return Promise.all(configPromises);
};

/**
 * Restore the guild roles
 */
export const loadRoles = (
    guild: Guild,
    backupData: BackupData,
    cache?: MemoryCache,
): Promise<Role[]> => {
    const rolePromises: Promise<Role>[] = [];
    backupData.roles.forEach((roleData) => {
        if (roleData.isEveryone) {
            rolePromises.push(
                guild.roles.cache.get(guild.id)!.edit({
                    name: roleData.name,
                    color: roleData.color,
                    permissions: BigInt(roleData.permissions),
                    mentionable: roleData.mentionable,
                }),
            );
        } else {
            rolePromises.push(
                guild.roles.create({
                    name: roleData.name,
                    color: roleData.color,
                    hoist: roleData.hoist,
                    permissions: BigInt(roleData.permissions),
                    mentionable: roleData.mentionable,
                }),
            );
        }
    });
    cache?.setItem(`${guild.id}_roles`, JSON.stringify({ finished: true }));
    return Promise.all(rolePromises);
};

/**
 * Restore the guild channels
 */
export const loadChannels = (
    guild: Guild,
    backupData: BackupData,
    options: RestoreServerOptions,
): Promise<unknown[]> => {
    const loadChannelPromises: Promise<void | unknown>[] = [];
    backupData.channels.categories.forEach((categoryData) => {
        loadChannelPromises.push(
            new Promise((resolve) => {
                loadCategory(categoryData, guild).then(
                    (createdCategory: any) => {
                        categoryData.children.forEach((channelData) => {
                            loadChannel(
                                channelData,
                                guild,
                                createdCategory,
                                options,
                            );
                            resolve(true);
                        });
                    },
                );
            }),
        );
    });
    backupData.channels.others.forEach((channelData) => {
        loadChannelPromises.push(
            loadChannel(channelData, guild, null, options),
        );
    });
    return Promise.all(loadChannelPromises);
};

/**
 * Restore member roles.
 */
export const loadMemberRoles = async (
    guild: Guild,
    backupData: BackupData,
    cache?: MemoryCache,
) => {
    // add roles after 10 seconds to make sure they got restored.
    setTimeout(async () => {
        const loadMemberRolesPromises: Promise<void | unknown>[] = [];
        const members = await guild.members.fetch();
        await guild.roles.fetch(undefined, {
            cache: true,
        });
        backupData.members?.forEach((member) => {
            const valid = members.find((m) => m.id === member.id);
            if (!valid) return;
            else {
                const roles: Collection<Snowflake, Role> = new Collection<
                    Snowflake,
                    Role
                >();
                member.roles?.forEach((r) => {
                    const role = guild.roles.cache.find(
                        (v) => v.name === r.roleName,
                    );
                    if (role) {
                        if (!roles.get(role.id)) {
                            roles.set(role.id, role);
                        }
                    }
                });
                loadMemberRolesPromises.push(
                    valid.roles
                        .set(roles, "Member Role Restore")
                        .catch(() => {}),
                );
            }
        });
        cache?.deleteItem(`${guild.id}_roles`);
        return Promise.all(loadMemberRolesPromises);
    }, 10000);
};

/**
 * Restore the afk configuration
 */
export const loadAFK = (
    guild: Guild,
    backupData: BackupData,
): Promise<Guild[]> => {
    const afkPromises: Promise<Guild>[] = [];
    if (backupData.afk) {
        afkPromises.push(
            guild.setAFKChannel(
                guild.channels.cache.find(
                    (ch) =>
                        // @ts-ignore
                        ch.name === backupData.afk.name &&
                        ch.type === "GUILD_VOICE",
                ) as VoiceChannel,
            ),
        );
        afkPromises.push(guild.setAFKTimeout(backupData.afk.timeout));
    }
    return Promise.all(afkPromises);
};

/**
 * Restore guild emojis
 */
export const loadEmojis = (
    guild: Guild,
    backupData: BackupData,
): Promise<Emoji[]> => {
    const emojiPromises: Promise<Emoji>[] = [];
    backupData.emojis.forEach((emoji) => {
        if (emoji.url) {
            // @ts-ignore
            emojiPromises.push(guild.emojis.create(emoji.url, emoji.name));
        } else if (emoji.base64) {
            emojiPromises.push(
                guild.emojis.create(
                    Buffer.from(emoji.base64, "base64"),
                    // @ts-ignore
                    emoji.name,
                ),
            );
        }
    });
    return Promise.all(emojiPromises);
};

/**
 * Restore guild bans
 */
export const loadBans = (
    guild: Guild,
    backupData: BackupData,
): Promise<string[]> => {
    const banPromises: Promise<string>[] = [];
    backupData.bans.forEach((ban) => {
        banPromises.push(
            guild.members.ban(ban.id, {
                reason: ban.reason ?? undefined,
            }) as Promise<string>,
        );
    });
    return Promise.all(banPromises);
};

/**
 * Restore embedChannel configuration
 */
export const loadEmbedChannel = (
    guild: Guild,
    backupData: BackupData,
): Promise<Guild[]> => {
    const embedChannelPromises: Promise<Guild>[] = [];
    if (backupData.widget.channel) {
        embedChannelPromises.push(
            guild.setWidgetSettings({
                // @ts-ignore
                enabled: backupData.widget.enabled,
                // @ts-ignore
                channel: guild.channels.cache.find(
                    (ch) => ch.name === backupData.widget.channel,
                ),
            }),
        );
    }
    return Promise.all(embedChannelPromises);
};
