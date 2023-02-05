import { Client, ClientOptions, Collection } from "discord.js";

export class DiscordClient extends Client {
    public commands: Collection<string, any>;
    public cooldowns: Collection<string, any>;

    constructor(options: ClientOptions) {
        super(options);
        this.commands = new Collection();
        this.cooldowns = new Collection();
    }
}
