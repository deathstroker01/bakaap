import {
    DefaultMessageNotificationLevel,
    ExplicitContentFilterLevel,
    VerificationLevel,
    Snowflake,
} from "discord.js";
import {
    AfkData,
    BanData,
    ChannelsData,
    EmojiData,
    RoleData,
    WidgetData,
} from "./";
import { MemberData } from "./MemberData";

export interface BackupData {
    name: string;
    iconURL?: string | undefined | null;
    iconBase64?: string;
    verificationLevel: VerificationLevel;
    explicitContentFilter: ExplicitContentFilterLevel;
    defaultMessageNotifications: DefaultMessageNotificationLevel | number;
    afk?: AfkData | null;
    widget: WidgetData;
    splashURL?: string;
    splashBase64?: string;
    bannerURL?: string | undefined | null;
    bannerBase64?: string;
    channels: ChannelsData;
    roles: RoleData[];
    bans: BanData[];
    emojis: EmojiData[];
    createdTimestamp: number;
    guildID: string;
    backup_id: Snowflake;
    members: MemberData[] | undefined;
    /**
     * @description The letoa account ID the backup is linked to.
     */
    accountID: string | null;
}
