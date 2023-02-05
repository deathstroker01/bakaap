import { model, Schema } from "mongoose";

const IntervalsModel = new Schema({
    id: {
        type: String,
        required: true,
    },
    /**
     * How many seconds we backup
     */
    interval: {
        type: Number,
        required: false,
        default: 0,
    },
    enabled: {
        type: Boolean,
        required: false,
        default: false,
    },
    lastBackup: {
        type: Number,
        required: false,
        default: null,
    },
});

export default model("intervals", IntervalsModel);
