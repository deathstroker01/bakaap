import { SlashCommandBuilder } from "@discordjs/builders";

export interface CommandType {
    data: SlashCommandBuilder;
    dms: boolean | undefined;
    execute: Function;
    permissions?: Array<any>;
    hidden?: boolean;
}
