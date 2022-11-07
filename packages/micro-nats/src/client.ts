import {
  MicroClient,
  PatternType,
  parseBuffer,
  composePattern,
} from "@ipare/micro";
import { MicroNatsClientOptions } from "./options";
import { initNatsConnection, MicroNatsConnection } from "./connection";
import * as nats from "nats";

export class MicroNatsClient extends MicroClient {
  constructor(protected readonly options: MicroNatsClientOptions = {}) {
    super();
    initNatsConnection.bind(this)();
  }

  async connect() {
    await this.initClients();
  }

  /**
   * for @ipare/inject
   */
  async dispose() {
    await this.closeClients();
  }

  async send<T = any>(
    pattern: PatternType,
    data: any,
    headers?: nats.MsgHdrsImpl
  ): Promise<{
    data: T;
    headers: nats.MsgHdrsImpl;
  }> {
    const packet = super.createPacket(pattern, data, true);

    const connection: nats.NatsConnection = this.connection as Exclude<
      typeof this.connection,
      undefined
    >;
    return new Promise(async (resolve) => {
      const reply = nats.createInbox(this.options.prefix);
      const sub = connection.subscribe(reply, {
        callback: (err, msg) => {
          if (err) {
            console.error(err);
            return;
          }

          parseBuffer(Buffer.from(msg.data), (packet) => {
            resolve({
              data: packet.data ?? packet.response,
              headers: msg.headers as nats.MsgHdrsImpl,
            });
          });
          sub.unsubscribe();
        },
      });

      this.#sendPacket(packet, headers, reply);
    });
  }

  emit(pattern: PatternType, data: any, headers?: nats.MsgHdrsImpl): void {
    const packet = super.createPacket(pattern, data, false);
    this.#sendPacket(packet, headers);
  }

  #sendPacket(packet: any, headers?: nats.MsgHdrsImpl, reply?: string) {
    const json = JSON.stringify(packet);
    const str = `${json.length}#${json}`;
    this.connection?.publish(
      this.prefix + composePattern(packet.pattern),
      Buffer.from(str, "utf-8"),
      {
        reply: reply,
        headers: headers,
      }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MicroNatsClient
  extends MicroNatsConnection<MicroNatsClientOptions> {}
