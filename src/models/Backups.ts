import { model, Schema } from "mongoose";

const BackupsSchema = new Schema(
    {
        name: {},
        region: {},
        verificationLevel: {},
        explicitContentFilter: {},
        defaultMessageNotifications: {},
        afk: {},
        widget: {},
        iconURL: {},
        bannerURL: {},
        splashURL: {},
        channels: { categories: [], others: [] },
        roles: {},
        bans: {},
        emojis: {},
        createdTimestamp: {},
        guildID: {},
        backup_id: {},
        members: {
            type: Array,
            required: false,
            default: [],
        },
        accountID: { type: String, required: false, default: null },
    },
    { strict: false, strictQuery: false },
);

export default model("backups", BackupsSchema);
