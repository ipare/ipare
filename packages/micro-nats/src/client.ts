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

  async send<T = any>(pattern: PatternType, data: any): Promise<T> {
    const packet = super.createPacket(pattern, data, true);

    const connection: nats.NatsConnection = this.connection as Exclude<
      typeof this.connection,
      undefined
    >;
    return new Promise(async (resolve) => {
      const reply = nats.createInbox(this.options.prefix);
      const sub = connection.subscribe(reply, {
        callback: (err, msg) => {
          parseBuffer(Buffer.from(msg.data), (packet) => {
            resolve(packet.data ?? packet.response);
          });
          sub.unsubscribe();
        },
      });

      this.#sendPacket(packet, reply);
    });
  }

  emit(pattern: PatternType, data: any): void {
    const packet = super.createPacket(pattern, data, false);
    this.#sendPacket(packet);
  }

  #sendPacket(packet: any, reply?: string) {
    const json = JSON.stringify(packet);
    const str = `${json.length}#${json}`;
    this.connection?.publish(
      this.prefix + composePattern(packet.pattern),
      Buffer.from(str, "utf-8"),
      {
        reply: reply,
      }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MicroNatsClient
  extends MicroNatsConnection<MicroNatsClientOptions> {}
