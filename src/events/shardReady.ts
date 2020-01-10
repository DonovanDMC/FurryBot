import ClientEvent from "../util/ClientEvent";
import { Logger } from "../util/LoggerV8";
import FurryBot from "@FurryBot";
import * as Eris from "eris";
import config from "../config";
import { db } from "../modules/Database";
import { ChannelNames, ChannelNamesCamelCase, Colors } from "../util/Constants";

export default new ClientEvent("shardReady", (async function (this: FurryBot, id: number) {
	Logger.log("Shard Ready", `Shard #${id} is ready.`);
	return this.executeWebhook(config.webhooks.shard.id, config.webhooks.shard.token, {
		embeds: [
			{
				title: "Shard Ready",
				description: `Shard #${id} is ready.`,
				timestamp: new Date().toISOString(),
				color: Colors.green
			}
		],
		username: `Furry Bot${config.beta ? " - Beta" : ""} Status`,
		avatarURL: "https://i.furry.bot/furry.png"
	}).catch(err => null);
}));
