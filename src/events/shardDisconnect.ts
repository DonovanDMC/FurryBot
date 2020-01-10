import ClientEvent from "../util/ClientEvent";
import { Logger } from "../util/LoggerV8";
import FurryBot from "@FurryBot";
import * as Eris from "eris";
import config from "../config";
import { db } from "../modules/Database";
import { ChannelNames, ChannelNamesCamelCase, Colors } from "../util/Constants";

export default new ClientEvent("shardDisconnect", (async function (this: FurryBot, err: Error, id: number) {
	Logger.error("Shard Disconnect", `Shard #${id} disconnected.`);
	Logger.error("Shard Disconnect", err);
	return this.executeWebhook(config.webhooks.shard.id, config.webhooks.shard.token, {
		embeds: [
			{
				title: "Shard Disconnect",
				description: `Shard #${id} disconnected.`,
				timestamp: new Date().toISOString(),
				color: Colors.green
			}
		],
		username: `Furry Bot${config.beta ? " - Beta" : ""} Status`,
		avatarURL: "https://i.furry.bot/furry.png"
	}).catch(err => null);
}));
