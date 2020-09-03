import Eris from "eris";
import config from "../../../config";
import Command from "../../../util/cmd/Command";
import { Colors } from "../../../util/Constants";
import EmbedBuilder from "../../../util/EmbedBuilder";
import Language from "../../../util/Language";
import Redis from "../../../util/Redis";

export default new Command(["snipe"], __filename)
	.setBotPermissions([])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setExecutor(async function (msg, cmd) {
		let ch: Eris.TextChannel;
		if (msg.args.length > 0) ch = await msg.getChannelFromArgs();

		if (!ch) ch = msg.channel;

		if (!ch.permissionsOf(msg.author.id).has("readMessages")) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.userCantSee`));
		if (!ch.permissionsOf(this.bot.user.id).has("readMessages")) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.selfCantSee`));

		let content = await Redis.get(`snipe:delete:${ch.id}:content`);
		const author = await Redis.get(`snipe:delete:${ch.id}:author`);
		const time = await Redis.get(`snipe:delete:${ch.id}:time`);

		if (!content || !author || !time) return msg.reply(Language.get(msg.gConfig.settings.lang, `${cmd.lang}.noSnipes`, [ch.id]));

		const i = content.match(new RegExp("((https?:\/\/)?(discord((app)?\.com\/invite|\.gg))\/[a-zA-Z0-9]{1,10})", "gi"));
		if (i) i.map(k => content = content.replace(new RegExp(k, "gi"), `[\[INVITE\]](${k})`));
		const u = await this.bot.getRESTUser(author);


		await Redis.del(`snipe:delete:${ch.id}:content`);
		await Redis.del(`snipe:delete:${ch.id}:author`);
		await Redis.del(`snipe:delete:${ch.id}:time`);

		return msg.channel.createMessage({
			embed: new EmbedBuilder(msg.gConfig.settings.lang)
				.setTitle(`{lang:${cmd.lang}.title}`)
				.setAuthor(`${u.username}#${u.discriminator}`, `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`)
				.setDescription(content)
				.setTimestamp(new Date(Number(time)).toISOString())
				.setColor(Colors.red)
				.toJSON()
		});
	});