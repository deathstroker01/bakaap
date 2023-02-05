import { BaseChannelData, MessageData } from "./";

export interface TextChannelData extends BaseChannelData {
    nsfw: boolean;
    parent?: string | undefined | null;
    topic?: string | undefined | null;
    rateLimitPerUser?: number;
    isNews: boolean;
    messages: MessageData[];
}
