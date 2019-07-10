import FurryBot from "@FurryBot";
import ExtendedMessage from "@src/modules/extended/ExtendedMessage";
import Command from "@modules/cmd/Command";
import * as Eris from "eris";
import functions from "@util/functions";
import * as util from "util";
import phin from "phin";
import config from "@config";
import { mdb } from "@modules/Database";
import lang from "@src/lang";

export default new Command({
	triggers: [
		"beg"
	],
	userPermissions: [],
	botPermissions: [],
	cooldown: 2e4,
	description: "Beg for free money",
	usage: "",
	nsfw: false,
	devOnly: true,
	betaOnly: false,
	guildOwnerOnly: false,
	path: __filename,
	hasSubCommands: functions.hasSubCmds(__dirname, __filename),
	subCommands: functions.subCmds(__dirname, __filename)
}, (async function (this: FurryBot, msg: ExtendedMessage): Promise<any> {
	if ([undefined, null].includes(msg.uConfig.bal)) await msg.uConfig.edit({ bal: 100 }).then(d => d.reload());

	const amount = Math.floor(Math.random() * 50) + 1;
	const people = [
		"Donovan_DMC",
		"Soul",
		"Trump",
		"Melmsie",
		"Flippy",
		"Jessi",
		"Tony",
		"Habchy",
		"Skullbite",
		msg.guild.members.random().username, // positility of a random person from the same server
		msg.guild.members.random().username, // positility of a random person from the same server
		msg.guild.members.random().username  // positility of a random person from the same server
	];
	const texts = [

	];

	const person = people[Math.floor(Math.random() * people.length)];
	const text = texts[Math.floor(Math.random() * texts.length)];

	// love you, skull
	if (person.toLowerCase() === "skullbite") msg.c = "**{0}** gave you {1}{2}, though they seemed to have some white substance on them..";

	const t = functions.formatStr(msg.c, person, amount, config.ecoEmoji);
	await msg.uConfig.edit({ bal: msg.uConfig.bal + amount }).then(d => d.reload());
	return msg.reply(t);
}));