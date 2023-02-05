import { randomBytes } from "crypto";
import {
    CategoryChannel,
    ChannelLogsQueryOptions,
    Collection,
    Guild,
    Message,
    NewsChannel,
    Snowflake,
    OverwriteData,
    TextChannel,
    VoiceChannel,
    Webhook,
    GuildChannelCreateOptions,
    PremiumTier,
    GuildChannel,
    ThreadChannel,
} from "discord.js";
import {
    BanData,
    ChannelPermissionsData,
    EmojiData,
    MessageData,
    RoleData,
    TextChannelData,
    VoiceChannelData,
    CategoryData,
    ChannelsData,
    RestoreServerOptions,
} from "./types";
import { CreateBackupOptions } from "./types/CreateBackup";
import { LoadBackupOptions } from "./types/LoadBackup";
import { MemberData } from "./types/MemberData";

const MaxBitratePerTier: Record<PremiumTier, number> = {
    NONE: 64000,
    TIER_1: 128000,
    TIER_2: 256000,
    TIER_3: 384000,
};

export function generateKey(size = 32) {
    return randomBytes(size).toString("hex").slice(0, size);
}

export async function getMembers(guild: Guild, options: CreateBackupOptions) {
    const members = await guild.members.fetch();
    const memberRoles: MemberData[] = [];

    for (const member of members.toJSON()) {
        memberRoles.push({
            id: member.id,
            avatar: member.avatarURL(),
            roles: member.roles.cache
                .filter((r) => r.id !== guild.roles.everyone.id)
                .map((role) => {
                    return {
                        roleId: role.id,
                        roleName: role.name,
                    };
                }),
            nickname: member.nickname,
            displayName: member.user.tag,
        });
    }

    return memberRoles;
}

export async function getChannels(guild: Guild, options: CreateBackupOptions) {
    return new Promise<ChannelsData>(async (resolve) => {
        const channels: ChannelsData = {
            categories: [],
            others: [],
        };

        const categories = (
            guild.channels.cache.filter(
                (ch) => ch.type === "GUILD_CATEGORY",
            ) as Collection<Snowflake, CategoryChannel>
        )
            .sort((a, b) => a.position - b.position)
            .toJSON() as CategoryChannel[];

        for (const category of categories) {
            const categoryData: CategoryData = {
                name: category.name, // The name of the category
                permissions: fetchChannelPermissions(category), // The overwrite permissions of the category
                children: [], // The children channels of the category
            };
            // Gets the children channels of the category and sort them by position
            const children = category.children
                .sort((a, b) => a.position - b.position)
                .toJSON();
            for (const child of children) {
                // For each child channel
                if (
                    child.type === "GUILD_TEXT" ||
                    child.type === "GUILD_NEWS"
                ) {
                    const channelData: TextChannelData =
                        await fetchTextChannelData(
                            child as TextChannel,
                            options,
                        ); // Gets the channel data
                    categoryData.children.push(channelData); // And then push the child in the categoryData
                } else {
                    const channelData: VoiceChannelData =
                        await fetchVoiceChannelData(child as VoiceChannel); // Gets the channel data
                    categoryData.children.push(channelData); // And then push the child in the categoryData
                }
            }
            channels.categories.push(categoryData); // Update channels object
        }

        const others = (
            guild.channels.cache.filter((ch) => {
                return (
                    !ch.parent &&
                    ch.type !== "GUILD_CATEGORY" &&
                    ch.type !== "GUILD_STORE" && // there is no way to restore store channels, ignore them
                    ch.type !== "GUILD_NEWS_THREAD" &&
                    ch.type !== "GUILD_PRIVATE_THREAD" &&
                    ch.type !== "GUILD_PUBLIC_THREAD"
                );
            }) as Collection<Snowflake, Exclude<GuildChannel, ThreadChannel>>
        )
            .sort((a, b) => a.position - b.position)
            .toJSON();

        for (const channel of others) {
            if (
                channel.type === "GUILD_TEXT" ||
                channel.type === "GUILD_NEWS"
            ) {
                const channelData: TextChannelData = await fetchTextChannelData(
                    channel as TextChannel,
                    options,
                ); // Gets the channel data
                channels.others.push(channelData); // Update channels object
            } else {
                const channelData: VoiceChannelData =
                    await fetchVoiceChannelData(channel as VoiceChannel); // Gets the channel data
                channels.others.push(channelData); // Update channels object
            }
        }
        resolve(channels); // Returns the list of the channels
    });
}

export async function getBans(guild: Guild) {
    const bans: BanData[] = [];
    const cases = await guild.bans.fetch();
    cases.forEach((ban) =>
        bans.push({
            id: ban.user.id,
            reason: ban.reason,
        }),
    );
    return bans;
}

export async function getRoles(guild: Guild) {
    const roles: RoleData[] = [];
    guild.roles.cache
        .filter((role) => !role.managed)
        .sort((a, b) => b.position - a.position)
        .forEach((role) => {
            const roleData = {
                name: role.name,
                color: role.hexColor,
                hoist: role.hoist,
                permissions: role.permissions.bitfield.toString(),
                mentionable: role.mentionable,
                position: role.position,
                isEveryone: guild.id === role.id,
            };
            roles.push(roleData);
        });
    return roles;
}

export async function getEmojis(guild: Guild) {
    const emojis: EmojiData[] = [];
    guild.emojis.cache.forEach(async (emoji) => {
        const eData: EmojiData = {
            name: emoji.name,
            url: emoji.url,
        };
        emojis.push(eData);
    });
    return emojis;
}

export function fetchChannelPermissions(
    channel: TextChannel | VoiceChannel | CategoryChannel | NewsChannel,
) {
    const permissions: ChannelPermissionsData[] = [];
    channel.permissionOverwrites.cache
        .filter((p) => p.type === "role")
        .forEach((perm) => {
            const role = channel.guild.roles.cache.get(perm.id);
            if (role) {
                permissions.push({
                    roleName: role.name,
                    allow: perm.allow.bitfield.toString(),
                    deny: perm.deny.bitfield.toString(),
                });
            }
        });
    return permissions;
}

export async function fetchVoiceChannelData(channel: VoiceChannel) {
    return new Promise<VoiceChannelData>(async (resolve, reject) => {
        const channelData: VoiceChannelData = {
            type: "GUILD_VOICE",
            name: channel.name,
            bitrate: channel.bitrate,
            userLimit: channel.userLimit,
            parent: channel.parent ? channel.parent.name : null,
            permissions: fetchChannelPermissions(channel),
        };
        resolve(channelData);
    });
}

export async function fetchChannelsMessages(
    channel: TextChannel | NewsChannel,
    options: CreateBackupOptions,
) {
    let messages: MessageData[] = [];
    const messageCount: number = isNaN(options.maxMessagesPerChannel)
        ? 10
        : options.maxMessagesPerChannel;
    const fetchOptions: ChannelLogsQueryOptions = { limit: 100 };
    let lastMessageId: Snowflake;
    let fetchComplete: boolean = false;
    while (!fetchComplete) {
        // @ts-ignore
        if (lastMessageId) {
            fetchOptions.before = lastMessageId;
        }
        const fetched: Collection<Snowflake, Message> =
            await channel.messages.fetch(fetchOptions);
        if (fetched.size === 0) {
            break;
        }
        // @ts-ignore
        lastMessageId = fetched.last().id;

        await Promise.all(
            fetched.map(async (msg) => {
                if (!msg.author || messages.length >= messageCount) {
                    fetchComplete = true;
                    return;
                }
                const files = await Promise.all(
                    msg.attachments.map(async (a) => {
                        let attach = a.url;
                        return {
                            name: a.name,
                            attachment: attach,
                        };
                    }),
                );
                if (!options.cache?.client.get(`opt_out_${msg.author.id}`)) {
                    messages.push({
                        username: msg.author.username,
                        avatar: msg.author.displayAvatarURL(),
                        content: msg.cleanContent,
                        embeds: msg.embeds,
                        // @ts-ignore
                        files,
                        pinned: msg.pinned,
                    });
                }
            }),
        );
    }

    return messages;
}

export async function fetchTextChannelData(
    channel: TextChannel | NewsChannel,
    options: CreateBackupOptions,
) {
    return new Promise<TextChannelData>(async (resolve) => {
        const channelData: TextChannelData = {
            type: channel.type,
            name: channel.name,
            nsfw: channel.nsfw,
            rateLimitPerUser:
                channel.type === "GUILD_TEXT"
                    ? channel.rateLimitPerUser
                    : undefined,
            parent: channel.parent ? channel.parent.name : null,
            topic: channel.topic,
            permissions: fetchChannelPermissions(channel),
            messages: [],
            isNews: channel.type === "GUILD_NEWS",
        };
        try {
            if (!(options.doNotBackup || []).includes("messages")) {
                channelData.messages = await fetchChannelsMessages(
                    channel,
                    options,
                );
                return resolve(channelData);
            } else return resolve(channelData);
        } catch (e) {
            resolve(channelData);
        }
    });
}

export async function loadCategory(categoryData: CategoryData, guild: Guild) {
    return new Promise<CategoryChannel>((resolve) => {
        guild.channels
            .create(categoryData.name, {
                type: "GUILD_CATEGORY",
            })
            .then(async (category) => {
                const finalPermissions: OverwriteData[] = [];
                categoryData.permissions.forEach((perm) => {
                    const role = guild.roles.cache.find(
                        (r) => r.name === perm.roleName,
                    );
                    if (role) {
                        finalPermissions.push({
                            id: role.id,
                            allow: BigInt(perm.allow),
                            deny: BigInt(perm.deny),
                        });
                    }
                });
                await category.permissionOverwrites.set(finalPermissions);
                resolve(category);
            });
    });
}

export async function loadChannel(
    channelData: TextChannelData | VoiceChannelData,
    guild: Guild,
    category?: CategoryChannel | null,
    options?: RestoreServerOptions,
) {
    return new Promise(async (resolve) => {
        const loadMessages = (
            channel: TextChannel,
            messages: MessageData[],
            previousWebhook?: Webhook,
        ): Promise<Webhook | void> => {
            return new Promise(async (resolve) => {
                const webhook =
                    previousWebhook ||
                    (await (channel as TextChannel).createWebhook("Letoa", {
                        avatar: channel.client.user?.displayAvatarURL(),
                    }));
                if (!webhook) {
                    console.log("INVALID WEBHOOK: ", webhook);
                    return resolve();
                }
                messages = messages
                    .filter(
                        (m: any) =>
                            m.content.length > 0 ||
                            m.embeds.length > 0 ||
                            m.files.length > 0,
                    )
                    .reverse();
                messages = messages.slice(
                    // @ts-ignore
                    messages.length - options.maxMessagesPerChannel,
                );
                for (const msg of messages) {
                    const sentMsg = await webhook
                        .send({
                            content: msg.content?.length
                                ? msg.content
                                : undefined,
                            username: msg.username,
                            avatarURL: msg.avatar,
                            embeds: msg.embeds,
                            // @ts-ignore
                            files: msg.files,
                        })
                        .catch((err) => console.log(err.message));
                    if (msg.pinned && sentMsg) await (sentMsg as Message).pin();
                }
                resolve(webhook);
            });
        };

        const createOptions: GuildChannelCreateOptions = {
            type: undefined,
            parent: category ? category : undefined,
        };

        if (
            channelData.type === "GUILD_TEXT" ||
            channelData.type === "GUILD_NEWS" ||
            channelData.type === "text"
        ) {
            createOptions.topic =
                (channelData as TextChannelData).topic ?? undefined;
            createOptions.nsfw = (channelData as TextChannelData).nsfw;
            createOptions.rateLimitPerUser = (
                channelData as TextChannelData
            ).rateLimitPerUser;
            createOptions.type =
                (channelData as TextChannelData).isNews &&
                guild.features.includes("NEWS")
                    ? "GUILD_NEWS"
                    : "GUILD_TEXT";
        } else if (
            channelData.type === "GUILD_VOICE" ||
            channelData.type === "voice"
        ) {
            // Downgrade bitrate
            let bitrate = (channelData as VoiceChannelData).bitrate;
            const bitrates = Object.values(MaxBitratePerTier);
            while (bitrate > MaxBitratePerTier[guild.premiumTier]) {
                bitrate =
                    bitrates[
                        Object.keys(MaxBitratePerTier).indexOf(
                            guild.premiumTier,
                        ) - 1
                    ];
            }
            createOptions.bitrate = bitrate;
            createOptions.userLimit = (
                channelData as VoiceChannelData
            ).userLimit;
            createOptions.type = "GUILD_VOICE";
        }
        guild.channels
            .create(channelData.name, createOptions)
            .then(async (channel) => {
                const finalPermissions: OverwriteData[] = [];
                channelData.permissions.forEach((perm) => {
                    const role = guild.roles.cache.find(
                        (r) => r.name === perm.roleName,
                    );
                    if (role) {
                        finalPermissions.push({
                            id: role.id,
                            allow: BigInt(perm.allow),
                            deny: BigInt(perm.deny),
                        });
                    }
                });
                await channel.permissionOverwrites.set(finalPermissions);

                if (
                    channelData.type === "GUILD_TEXT" ||
                    channelData.type === "text"
                ) {
                    let webhook: Webhook | void;
                    if ((channelData as TextChannelData).messages.length > 0) {
                        webhook = await loadMessages(
                            channel as TextChannel,
                            (channelData as TextChannelData).messages,
                        ).catch(() => {});
                    }
                    return channel;
                } else {
                    resolve(channel);
                }
            });
    });
}

/**
 * Delete all roles, all channels, all emojis, etc... of a guild
 */
export async function clearGuild(guild: Guild) {
    guild.roles.cache
        .filter(
            (role) => !role.managed && role.editable && role.id !== guild.id,
        )
        .forEach((role) => {
            role.delete().catch(() => {});
        });
    guild.channels.cache.forEach((channel) => {
        channel.delete().catch(() => {});
    });
    guild.emojis.cache.forEach((emoji) => {
        emoji.delete().catch(() => {});
    });
    const webhooks = await guild.fetchWebhooks();
    webhooks.forEach((webhook) => {
        webhook.delete().catch(() => {});
    });
    const bans = await guild.bans.fetch();
    bans.forEach((ban) => {
        guild.members.unban(ban.user).catch(() => {});
    });
    guild.setAFKChannel(null);
    guild.setAFKTimeout(60 * 5);
    guild.setIcon(null);
    guild.setBanner(null).catch(() => {});
    guild.setSplash(null).catch(() => {});
    guild.setDefaultMessageNotifications("ONLY_MENTIONS");
    guild.setWidgetSettings({
        enabled: false,
        channel: null,
    });
    if (!guild.features.includes("COMMUNITY")) {
        guild.setExplicitContentFilter("DISABLED");
        guild.setVerificationLevel("NONE");
    }
    guild.setSystemChannel(null);
    guild.setSystemChannelFlags([
        "SUPPRESS_GUILD_REMINDER_NOTIFICATIONS",
        "SUPPRESS_JOIN_NOTIFICATIONS",
        "SUPPRESS_PREMIUM_SUBSCRIPTIONS",
    ]);
    return;
}
