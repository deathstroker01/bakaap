import { DoNotBackupOptions } from "./DoNotBackup";

export interface LoadBackupOptions {
    maxMessagesPerChannel: number;
    doNotRestore: Array<DoNotBackupOptions>;
}
