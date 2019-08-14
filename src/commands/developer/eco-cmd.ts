import FurryBot from "@FurryBot";
import ExtendedMessage from "@src/modules/extended/ExtendedMessage";
import Command from "@modules/cmd/Command";
import * as Eris from "eris";
import functions from "@util/functions";
import * as util from "util";
import phin from "phin";
import config from "@config";

export default new Command({
	triggers: [
		"eco"
	],
	userPermissions: [],
	botPermissions: [],
	cooldown: 0,
	description: "Manages the bots economy",
	usage: "",
	nsfw: false,
	devOnly: true,
	betaOnly: false,
	guildOwnerOnly: false,
	path: __filename,
	hasSubCommands: functions.hasSubCmds(__dirname, __filename),
	subCommands: functions.subCmds(__dirname, __filename)
}, (async function (this: FurryBot, msg: ExtendedMessage): Promise<any> {
	const sub = await functions.processSub(msg.cmd.command, msg, this);
	if (sub !== "NOSUB") return sub;
	else return functions.sendCommandEmbed(msg, msg.cmd.command);
}));