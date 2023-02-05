import fs from "fs";

export class Logging {
    public file: any;
    constructor({ file = "logs/logs.log" }: { file: any | undefined }) {
        this.file = file;
    }

    async createFile(): Promise<void> {
        fs.writeFile(this.file, "[DEBUG] CREATED LOG FILE", (err) => {
            if (err) throw err;
            return;
        });
    }

    async clearFile(): Promise<void> {
        await fs.truncateSync(this.file, 0);
        return;
    }

    async writeToLog(content: string): Promise<void> {
        content += "\n";
        await fs.appendFileSync(this.file, content);
        return;
    }
}

