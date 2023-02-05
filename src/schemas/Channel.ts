import {
    GuildChannel,
    MessageEmbed,
    TextChannel,
    MessageActionRow,
    BaseMessageComponentOptions,
    MessageActionRowOptions,
} from "discord.js";

type Options = {
    content?: string;
    embeds?: Array<MessageEmbed>;
    components?:
        | (
              | MessageActionRow
              | (Required<BaseMessageComponentOptions> &
                    MessageActionRowOptions)
          )[]
        | undefined;
};

export interface LetoaChannel extends GuildChannel {
    send: (options: Options) => {};
}
