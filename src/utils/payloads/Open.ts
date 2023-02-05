import WS from "ws";
import { Send } from "../WebSocket";

export async function onOpen(this: WS) {
    await Send(this, {
        op: 2,
        d: {
            token: "",
        },
    });
}
