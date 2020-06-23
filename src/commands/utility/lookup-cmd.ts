import Command from "../../modules/CommandHandler/Command";
import { Time } from "../../util/Functions";
import { ChannelNames, Colors } from "../../util/Constants";
import EmbedBuilder from "../../util/EmbedBuilder";
import Eris from "eris";
import config from "../../config";
import phin from "phin";
import CommandError from "../../modules/CommandHandler/CommandError";

export default new Command({
	triggers: [
		"lookup"
	],
	permissions: {
		user: [],
		bot: []
	},
	cooldown: 3e3,
	donatorCooldown: 3e3,
	restrictions: [],
	file: __filename
}, (async function (msg, uConfig, gConfig, cmd) {
	if (msg.args.length < 1) return new CommandError("ERR_INVALID_USAGE", cmd);

	// According to Discord's developers, ids can *techincally* be between 15 and 21 numbers.
	if (msg.args[0].length < 15 || msg.args.length > 21) return msg.reply("{lang:commands.utility.lookup.invalid}");

	const w = await phin<any>({
		method: "GET",
		url: `https://discordapp.com/api/guilds/${msg.args[0]}/widget.json`,
		headers: {
			"Authorization": `Bot ${config.client.token}`,
			"User-Agent": config.web.userAgent
		},
		parse: "json"
	});

	switch (w.statusCode) {
		case 200:
			const embed = new EmbedBuilder(gConfig.settings.lang)
				.setTitle("{lang:commands.utility.lookup.found}")
				.setDescription(`{lang:commands.utility.lookup.foundDesc|${msg.args[0]}}`)
				.setColor(Colors.green)
				.setTimestamp(new Date().toISOString());

			const code = w.body.instant_invite.match(new RegExp("^((https?\:\/\/)?(discord\.gg|discordapp\.com\/invite)\/)?([A-Za-z0-9]{2,32})$", "i"))[4];
			const inv = (await this.bot.getInvite(code, true).catch(err => null)) as Eris.RESTChannelInvite;
			if (!inv) {
				embed.addField(
					"{lang:commands.utility.lookup.info}",
					[
						`\u25FD {lang:commands.utility.lookup.serverName}: ${w.body.name}`,
						`\u25FD {lang:commands.utility.lookup.creation}: ${Time.formatDateWithPadding(new Date(Number(BigInt(w.body.id) / 4194304n + 1420070400000n)), true)}`,
						`\u25FD {lang:commands.utility.lookup.list}: ${w.body.presence_count}`,
						`\t<:${config.emojis.online}> ${w.body.members.filter(m => m.status === "online").length}`,
						`\t<:${config.emojis.idle}> ${w.body.members.filter(m => m.status === "idle").length}`,
						`\t<:${config.emojis.dnd}> ${w.body.members.filter(m => m.status === "dnd").length}`
					].join("\n"),
					false
				);
			} else {
				const { guild, inviter, channel } = inv;
				embed.addField(
					"{lang:commands.utility.lookup.srvChInfo}",
					[
						"**{lang:commands.utility.lookup.extra}**:",
						`\u25FD {lang:commands.utility.lookup.code}: [${inv.code}](https://discord.gg/${inv.code})`,
						"",
						"**{lang:commands.utility.lookup.server}**:",
						`\u25FD {lang:commands.utility.lookup.serverName}: [${guild.name}](https://discord.gg/${inv.code})`,
						`\u25FD {lang:commands.utility.lookup.serverId}: ${guild.id}`,
						`\u25FD {lang:commands.utility.lookup.memberCount}: ${inv.memberCount || "{lang:commands.utility.lookup.unknown}"}`,
						`\u25FD {lang:commands.utility.lookup.presenceCount}: ${inv.presenceCount || "{lang:commands.utility.lookup.unknown}"}`,
						`\u25FD {lang:commands.utility.lookup.vanityURLCode}: ${inv.guild.vanityUrlCode || "{lang:commands.utility.lookup.none}"}`,
						"",
						"**{lang:commands.utility.lookup.channel}**:",
						`\u25FD {lang:commands.utility.lookup.channelName}: ${channel.name}`,
						`\u25FD {lang:commands.utility.lookup.channelId}: ${channel.id}`,
						`\u25FD {lang:commands.utility.lookup.channelType}: ${ChannelNames[channel.type]}`
					].join("\n"),
					false
				);

				if (!!inviter) {
					embed.addField(
						"{lang:commands.utility.lookup.inviter}",
						[
							`{lang:commands.utility.lookup.name}: ${inviter.username}#${inviter.discriminator}`,
							`{lang:commands.utility.lookup.id}: ${inviter.id}`,
							`{lang:commands.utility.lookup.bot}: ${inviter.bot ? "{lang:commands.utility.lookup.yes}" : "{lang:commands.utility.lookup.no}"}`,
							`{lang:commands.utility.lookup.system}: ${inviter.system ? "{lang:commands.utility.lookup.yes}" : "{lang:commands.utility.lookup.no}"}`
						].join("\n"),
						false
					);
					embed.setThumbnail(inviter.avatarURL);
				}

				embed.setAuthor(guild.name, !guild.icon ? "https://i.furcdn.net/noicon.png" : `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`);
			}

			return msg.channel.createMessage({
				embed: embed.toJSON()
			});
			break;

		case 403:
			return msg.channel.createMessage({
				embed: new EmbedBuilder(gConfig.settings.lang)
					.setTitle("{lang:commands.utility.lookup.found}")
					.setDescription(`{lang:commands.utility.lookup.foundDesc|${msg.args[0]}} {lang:commands.utility.lookup.noInfo}`)
					.setColor(Colors.orange)
					.setTimestamp(new Date().toISOString())
					.toJSON()
			});
			break;

		case 404:
			return msg.channel.createMessage({
				embed: new EmbedBuilder(gConfig.settings.lang)
					.setTitle("{lang:commands.utility.lookup.notFound}")
					.setDescription(`{lang:commands.utility.lookup.notFoundDesc|${msg.args[0]}}`)
					.setColor(Colors.red)
					.setTimestamp(new Date().toISOString())
					.toJSON()
			});
			break;

		default:
			console.error(w.body);
			return msg.channel.createMessage({
				embed: new EmbedBuilder(gConfig.settings.lang)
					.setTitle("{lang:commands.utility.lookup.discordError}")
					.setDescription(`{lang:commands.utility.lookup.discordErrorDesc|${w.statusCode}|${w.statusMessage}}`)
					.setColor(Colors.red)
					.setTimestamp(new Date().toISOString())
					.toJSON()
			});
	}
}));
