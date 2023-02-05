import WS from "ws";
import { onOpen } from "./payloads/Open";

export class WebSocketHandler {
    public ws: WS;
    public uri: string;
    public heartbeatInterval: NodeJS.Timer | null;

    constructor({ uri, options }: { uri: string; options?: WS.ClientOptions }) {
        this.uri = uri;
        this.ws = new WS(uri, options);
        this.heartbeatInterval = null;

        this.ws.on("open", onOpen);

        this.ws.on("message", (socket: WS, message: WS.Data) => {
            var data: Payload;
            try {
                data = JSON.parse(String(message));
            } catch (e) {
                console.error("decode error", e);
                return socket.close();
            }

            if (data.op === 10) {
                this.heartbeatInterval = setInterval(async () => {
                    await Send(socket, {
                        op: 1,
                    });
                }, data.d.heartbeat_interval);
            } else {
            }
        });
    }
}

export enum OpCodes {
    SEND_HEARTBEAT = 1,
    IDENTIFY = 2,
    HEARBEAT = 10,
}

export interface Payload {
    op: OpCodes;
    d?: any;
    s?: number;
    t?: any;
}

export async function Send(socket: WS, data: Payload) {
    let buffer: Buffer | string = JSON.stringify(data);
    return new Promise((res, rej) => {
        if (socket.readyState !== 1) {
            return rej("Socket Not Open");
        }
        socket.send(buffer, (err: any) => {
            if (err) return rej(err);
            return res(null);
        });
    });
}
