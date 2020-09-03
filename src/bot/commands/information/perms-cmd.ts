import Command from "../../../util/cmd/Command";
import EmbedBuilder from "../../../util/EmbedBuilder";
import { Colors, Permissions } from "../../../util/Constants";
import Utility from "../../../util/Functions/Utility";

export default new Command(["perms"], __filename)
	.setBotPermissions([
		"embedLinks"
	])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setExecutor(async function (msg, cmd) {
		const remove = ["all", "allGuild", "allText", "allVoice"];
		const member = msg.args.length === 0 ? msg.member : await msg.getMemberFromArgs();
		if (!member) return msg.channel.createMessage({
			embed: Utility.genErrorEmbed(msg.gConfig.settings.lang, "INVALID_MEMBER", true)
		});

		return msg.channel.createMessage({
			embed: new EmbedBuilder(msg.gConfig.settings.lang)
				.setTitle(`{lang:${cmd.lang}.title}`)
				.setAuthor(msg.author.tag, msg.author.avatarURL)
				.setTimestamp(new Date().toISOString())
				.setColor(Colors.green)
				.setDescription([
					`{lang:${cmd.lang}.${member.id === msg.member.id ? "self" : `other|${msg.author.tag}`}}`,
					"```diff",
					...Object.keys(Permissions.constant).filter(p => !remove.includes(p)).map(p => `${member.permissions.has(p) ? "+" : "-"} ${msg.dashedArgs.value.includes("compact") ? p : `{lang:other.permissions.${p}}`}`),
					"```",
					...(!msg.dashedArgs.value.includes("compact") ? [
						"",
						`{lang:${cmd.lang}.compact|${msg.gConfig.settings.prefix}|${member.username}#${member.discriminator}}`
					] : [])
				].join("\n"))
				.toJSON()
		});
	});