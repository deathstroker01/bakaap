import mongoose from "mongoose";

import Backups from "../models/Backups";
import Intervals from "../models/Intervals";

class DatabaseClient {
    static backups = Backups;
    static intervals = Intervals;

    static connect(): Promise<any> {
        return new Promise((resolve, reject) => {
            mongoose
                .connect(
                    process.env.MONGODB_URI
                        ? process.env.MONGODB_URI
                        : "mongodb://localhost:27017/letoa",
                    {
                        autoCreate: true,
                        bufferCommands: false,
                        user: process.env.MONGO_USERNAME,
                        pass: process.env.MONGO_PASSWORD,
                        authSource: process.env.MONGO_AUTH,
                    },
                )
                .then(() => {
                    console.log("[Gateway] Database connected successfully");
                    return resolve(true);
                })
                .catch((e) => {
                    console.error(
                        `[Gateway] Failed to connect to database. Error: ${e}`,
                    );
                    return reject(e);
                });
        });
    }

    /**
     *
     * @param {Object} data
     * @description
     * ```js
     * this.getInterval({id: "1234567890", enabled: true})
     * ```
     * @returns
     */
    static async getInterval(data: Object) {
        const t = await this.intervals.findOne(data);
        if (!t) return this.intervals.create(data);
        else return t;
    }
}

export default DatabaseClient;
