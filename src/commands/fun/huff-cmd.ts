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
		"huff",
		"huf"
	],
	userPermissions: [],
	botPermissions: [],
	cooldown: 2e3,
	description: "Blow someone's house down..",
	usage: "<@member/string>",
	nsfw: false,
	devOnly: false,
	betaOnly: false,
	guildOwnerOnly: false,
	path: __filename,
	hasSubCommands: functions.hasSubCmds(__dirname, __filename),
	subCommands: functions.subCmds(__dirname, __filename)
}, (async function (this: FurryBot, msg: ExtendedMessage): Promise<any> {
	let input, text;
	if (msg.args.length === 0) return new Error("ERR_INVALID_USAGE");

	input = msg.args.join(" ");
	text = functions.formatStr(msg.c, msg.author.mention, input);
	msg.channel.createMessage(text, {
		file: await functions.getImageFromURL("https://assets.furry.bot/huff.gif"),
		name: "huff.gif"
	});
}));