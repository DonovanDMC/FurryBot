import Command from "../../util/CommandHandler/lib/Command";
import FurryBot from "@FurryBot";
import ExtendedMessage from "@ExtendedMessage";
import * as Eris from "eris";
import { Utility } from "../../util/Functions";

export default new Command({
	triggers: [
		"softban",
		"sb"
	],
	userPermissions: [
		"banMembers"
	],
	botPermissions: [
		"banMembers"
	],
	cooldown: 1e3,
	donatorCooldown: 1e3,
	description: "Ban someone to delete their messages, then immediately unbans them.",
	usage: "<@member/id> <reason>",
	features: [],
	file: __filename
}, (async function (this: FurryBot, msg: ExtendedMessage) {
	if (msg.args.length === 0) throw new Error("ERR_INVALID_USAGE");
	// let m;
	// get member from message
	const user = await msg.getMemberFromArgs();

	if (!user) return msg.errorEmbed("INVALID_USER");

	if (msg.channel.permissionsOf(this.user.id).has("viewAuditLogs")) {
		if (await msg.channel.guild.getBans().then(res => res.map(u => u.user.id).includes(user.id))) {
			const embed: Eris.EmbedOptions = {
				title: "User already banned",
				description: `It looks like ${user.username}#${user.discriminator} is already banned here..`,
				timestamp: new Date().toISOString(),
				author: {
					name: msg.author.tag,
					icon_url: msg.author.avatarURL
				},
				color: Math.floor(Math.random() * 0xFFFFFF)
			};

			return msg.channel.createMessage({ embed });
		}
	}

	if (user.id === msg.member.id && !msg.user.isDeveloper) return msg.reply("Pretty sure you don't want to do this to yourself.");
	if (user.id === msg.guild.ownerID) return msg.reply("You cannot ban the server owner.");
	const a = Utility.compareMembers(user, msg.member);
	if ((a.member1.higher || a.member1.same) && msg.author.id !== msg.channel.guild.ownerID) return msg.reply(`You cannot ban ${user.username}#${user.discriminator} as their highest role is higher than yours!`);
	// if(!user.bannable) return msg.channel.createMessage(`<@!${msg.author.id}>, I cannot ban ${user.username}#${user.discriminator}! Do they have a higher role than me? Do I have ban permissions?`);
	const reason = msg.args.length >= 2 ? msg.args.splice(1).join(" ") : "No Reason Specified";
	// if (!user.user.bot) m = await user.user.getDMChannel().then(dm => dm.createMessage(`You were banned from **${msg.channel.guild.name}**\nReason: ${reason}`));
	user.ban(7, `Softban: ${msg.author.username}#${msg.author.discriminator} -> ${reason}`).then(() =>
		// msg.gConfig.modlog.add({ blame: this.bot.user.id, action: "ban", userId: user.id, reason, timestamp: Date.now() }).then(() =>
		msg.channel.createMessage(`***User ${user.username}#${user.discriminator} was softbanned, ${reason}***`).catch(noerr => null)
		// )
	).catch(async (err) => {
		await msg.channel.createMessage(`I couldn't softban **${user.username}#${user.discriminator}**, ${err}`);
		// if (!!m) await m.delete();
	}).then(() => user.unban(`Softban: ${msg.author.username}#${msg.author.discriminator} -> ${reason}`)).catch(err =>
		msg.channel.createMessage(`I couldn't unban **${user.username}#${user.discriminator}**, ${err}`)
	);

	if (msg.channel.permissionsOf(this.user.id).has("manageMessages")) msg.delete().catch(error => null);
}));
