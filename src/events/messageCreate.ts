import ClientEvent from "../util/ClientEvent";
import { Logger } from "../util/LoggerV8";
import FurryBot from "@FurryBot";
import * as Eris from "eris";
import config from "../config";
import { mdb } from "../modules/Database";
import * as fs from "fs-extra";
import ExtendedMessage from "../modules/ExtendedMessage";
import Timers from "../util/Timers";
import { ChannelNamesCamelCase } from "../util/Constants";
import Permissions from "../util/Permissions";

export default new ClientEvent("messageCreate", (async function (this: FurryBot, message: Eris.Message) {
	if ([Eris.Constants.ChannelTypes.DM, Eris.Constants.ChannelTypes.GROUP_DM].includes(message.channel.type as any)) this.stats.dmMessageCount++;
	else this.stats.messageCount++;
	let msg: ExtendedMessage;
	try {
		const t = new Timers();
		t.start("main");

		this.increment([
			"events.messageCreate",
			`events.messageCreate.mentionEveryone.${message.mentionEveryone ? "yes" : "no"}`,
			`events.messageCreate.tts.${message.tts ? "yes" : "no"}`
		], [`channelType:${ChannelNamesCamelCase[message.channel.type]}`]);

		if (!message || !message.author || message.author.bot) return;

		if (config.beta && !config.developers.includes(message.author.id)) return;
		t.start("messageProcess");
		msg = new ExtendedMessage(message, this);
		await msg._load();
		t.end("messageProcess");

		let bl = false;

		if ([Eris.Constants.ChannelTypes.GUILD_TEXT, Eris.Constants.ChannelTypes.GUILD_NEWS].includes(msg.channel.type) && msg.gConfig && msg.gConfig.blacklist.blacklisted === true) bl = true;
		if (msg.uConfig.blacklist.blacklisted === true) bl = true;

		if (bl) {
			if (!fs.existsSync(`${config.rootDir}/src/config/json/other/blNoticeViewed.json`)) fs.writeFileSync(`${config.rootDir}/src/config/json/other/blNoticeViewed.json`, JSON.stringify([]));
			if (msg.cmd) {
				const b: string[] = JSON.parse(fs.readFileSync(`${config.rootDir}/src/config/json/other/blNoticeViewed.json`).toString());
				if (msg.uConfig.blacklist.blacklisted && !b.includes(msg.author.id)) {
					b.push(msg.author.id);
					fs.writeFileSync(`${config.rootDir}/src/config/json/other/blNoticeViewed.json`, JSON.stringify(b));
					if (msg.uConfig.blacklist.reason !== null) return msg.reply(`you have been blacklisted. Reason: ${msg.uConfig.blacklist.reason}, blame: ${msg.uConfig.blacklist.blame}. You can ask about your blacklist in our support server: <${config.bot.supportInvite}>`);
					else return;
				}

				if ([Eris.Constants.ChannelTypes.GUILD_TEXT, Eris.Constants.ChannelTypes.GUILD_NEWS].includes(msg.channel.type) && msg.gConfig.blacklist.blacklisted && !b.includes(msg.channel.guild.id)) {
					b.push(msg.channel.guild.id);
					fs.writeFileSync(`${config.rootDir}/src/config/json/other/blNoticeViewed.json`, JSON.stringify(b));
					if (msg.gConfig.blacklist.reason !== null) return msg.reply(`this server has been blacklisted. Reason: ${msg.gConfig.blacklist.reason}, blame: ${msg.gConfig.blacklist.blame}.`);
					else return;
				}
			}

			return;
		}

		t.start("dm");
		if (message.channel.type === Eris.Constants.ChannelTypes.DM) {
			this.increment([
				"events.messageCreate.directMessage"
			]);

			if (bl) return;

			if (/discord\.gg/gi.test(msg.content.toLowerCase())) {
				const g = await this.getRESTGuild(config.bot.mainGuild);
				await g.banMember(message.author.id, 0, "Advertising in bots dms.");

				const embed: Eris.EmbedOptions = {
					title: `DM Advertisment from ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
					description: "User auto banned.",
					fields: [{
						name: "Content",
						value: msg.content,
						inline: false
					}]
				};

				await this.executeWebhook(config.webhooks.directMessage.id, config.webhooks.directMessage.token, {
					embeds: [embed],
					username: `Direct Messages${config.beta ? " - Beta" : ""}`,
					avatarURL: "https://i.furry.bot/furry.png"
				});

				await msg.author.getDMChannel().then(dm => dm.createMessage("Hey, I see that you're sending dm advertisments to me, that isn't a good idea.. You've been auto banned from my support server for dm advertising.")).catch(err => null);
				return Logger.log("Direct Message", `DM Advertisment recieved from ${msg.author.username}#${msg.author.discriminator}: ${msg.content}`);
			} else {
				const embed: Eris.EmbedOptions = {
					title: `Direct Message from ${msg.author.username}#${msg.author.discriminator} (${msg.author.id})`,
					fields: [{
						name: "Content",
						value: msg.content,
						inline: false
					}]
				};

				await this.executeWebhook(config.webhooks.directMessage.id, config.webhooks.directMessage.token, {
					embeds: [embed],
					username: `Direct Messages${config.beta ? " - Beta" : ""}`,
					avatarURL: "https://i.furry.bot/furry.png"
				});

				await msg.author.getDMChannel().then(dm => dm.createMessage(config.bot.directMessage.join("\n")));
				return Logger.log("Direct Message", `Direct message recieved from ${msg.author.username}#${msg.author.discriminator}: ${msg.content}`);
			}
		}
		t.end("dm");

		if ([`<@!${this.user.id}>`, `<@${this.user.id}>`].includes(msg.content)) {
			this.increment([
				"other.clientMention"
			], [`channelType:${ChannelNamesCamelCase[message.channel.type]}`]);
			const p = [
				"kickMembers",
				"banMembers",
				"manageChannels",
				"manageGuild",
				"addReactions",
				"viewAduitLog",
				"voicePrioritySpeaker",
				"readMessages",
				"sendMessages",
				"manageMessages",
				"embedLinks",
				"attachFiles",
				"readMessageHistory",
				"externalEmojis",
				"voiceConnect",
				"voiceSpeak",
				"voiceMuteMembers",
				"voiceDeafenMembers",
				"voiceMoveMembers",
				"voiceuserVAD",
				"changeNickname",
				"manageNicknames",
				"manageRoles"
			];
			const botPerms = p.map(perm => Permissions.constant[perm]).reduce((a, b) => a + b);

			const embed: Eris.EmbedOptions = {
				title: "Hi, I'm your little friend, Furry Bot!",
				color: this.f.randomColor(),
				author: {
					name: msg.author.tag,
					icon_url: msg.author.avatarURL
				},
				timestamp: new Date().toISOString(),
				description: [
					`Hi, ${msg.author.tag}! Since you've mentioned me, here's a little about me:`,
					`My prefix here is ${msg.gConfig.settings.prefix}, you can see my commands by using \`${msg.gConfig.settings.prefix}help\`, you can change my prefix by using \`${msg.gConfig.settings.prefix}prefix <new prefix>\``,
					`If you want to invite me to another server, you can use [this link](https://discordapp.com/oauth2/authorize?client_id=${this.user.id}&scope=bot&permissions=${botPerms}), or, if that isn't working, you can visit [https://furry.bot/add](https://furry.bot/add)`,
					`If you need some help with me, you can visit my support server [here](https://discord.gg/YazeA7e)`
				].join("\n")
			};

			if (!msg.channel.permissionsOf(this.user.id).has("sendMessages")) {
				return msg.author.getDMChannel().then(dm => dm.createMessage({
					content: "I couldn't send messages in the channel where I was mentioned, so I sent this directly to you!",
					embed
				})).catch(err => null);
			} else if (!msg.channel.permissionsOf(this.user.id).has("embedLinks")) {
				return msg.channel.createMessage(`${embed.title}\n${embed.description}\n(If you give me permission to embed links this would look a lot nicer)`);
			} else {
				return msg.channel.createMessage({
					embed
				});
			}
		}

		t.start("autoResponse");
		if (["f", "rip"].includes(msg.content.toLowerCase()) && msg.gConfig.settings.fResponse) {
			if (!msg.channel.permissionsOf(this.user.id).has("sendMessages")) return;
			this.increment([
				"other.autoResponse.f"
			], [`channelType:${ChannelNamesCamelCase[message.channel.type]}`]);
			if (!config.developers.includes(msg.author.id) && !msg.uConfig.blacklist.blacklisted) {
				this.responseSpamCounter.push({
					time: Date.now(),
					user: msg.author.id,
					response: "f"
				});

				const sp = [...this.responseSpamCounter.filter(s => s.user === msg.author.id)];
				let spC = sp.length;
				if (sp.length >= config.antiSpam.response.start && sp.length % config.antiSpam.response.warning === 0) {

					let report: any = {
						userTag: msg.author.tag,
						userId: msg.author.id,
						generatedTimestamp: Date.now(),
						entries: sp.map(s => ({ response: s.response, time: s.time })),
						type: "response",
						beta: config.beta
					};

					const d = fs.readdirSync(`${config.logsDir}/spam`).filter(d => !fs.lstatSync(`${config.logsDir}/spam/${d}`).isDirectory() && d.startsWith(msg.author.id) && d.endsWith("-response.json") && fs.lstatSync(`${config.logsDir}/spam/${d}`).birthtimeMs + 1.2e5 > Date.now());

					if (d.length > 0) {
						report = this.f.combineReports(...d.map(f => JSON.parse(fs.readFileSync(`${config.logsDir}/spam/${f}`).toString())), report);
						spC = report.entries.length;
						d.map(f => fs.unlinkSync(`${config.logsDir}/spam/${f}`));
					}

					const reportId = this.f.random(10);

					fs.writeFileSync(`${config.logsDir}/spam/${msg.author.id}-${reportId}-response.json`, JSON.stringify(report));

					await this.executeWebhook(config.webhooks.logs.id, config.webhooks.logs.token, {
						embeds: [
							{
								title: `Possible Auto Response Spam From ${msg.author.tag} (${msg.author.id}) | VL: ${spC}`,
								description: `Report: ${config.beta ? `https://${config.apiBindIp}:${config.apiPort}/reports/response/${msg.author.id}/${reportId}` : `https://botapi.furry.bot/reports/response/${msg.author.id}/${reportId}`}`
							}
						],
						username: `FurryBot Spam Logs${config.beta ? " - Beta" : ""}`,
						avatarURL: "https://assets.furry.bot/blacklist_logs.png"
					});

					if (spC >= config.antiSpam.response.blacklist) {
						await msg.uConfig.edit({
							blacklist: {
								blacklisted: true,
								reason: `Spamming Auto Responses. Automatic Blacklist.`,
								blame: "Automatic"
							}
						});

						await this.executeWebhook(config.webhooks.logs.id, config.webhooks.logs.token, {
							embeds: [
								{
									title: "User Blacklisted",
									description: `Id: ${msg.author.id}\nTag: ${msg.author.tag}\nReason: Spamming Auto Responses. Automatic Blacklist.\nBlame: Automatic`,
									timestamp: new Date().toISOString(),
									color: this.f.randomColor()
								}
							],
							username: `Blacklist Logs${config.beta ? " - Beta" : ""}`,
							avatarURL: "https://assets.furry.bot/blacklist_logs.png"
						});
					}

					return;
				}
			}

			let count = await mdb.collection("stats").findOne({ id: "fCount" }).then(res => parseInt(res.count, 10)).catch(err => 1);
			await mdb.collection("stats").findOneAndUpdate({ id: "fCount" }, { $set: { count: ++count } });
			return msg.channel.createMessage(`<@!${msg.author.id}> has paid respects.\n\nRespects paid total: **${count}**\n\nYou can turn this auto response off by using \`${msg.gConfig.settings.prefix}settings fResponse disabled\``);
		}
		t.end("autoResponse");

		if (!msg.prefix || !msg.content.toLowerCase().startsWith(msg.prefix.toLowerCase()) || msg.content.toLowerCase() === msg.prefix.toLowerCase() || !msg.cmd || !msg.cmd.cmd) return;
		const cmd = msg.cmd.cmd;

		if (!config.developers.includes(msg.author.id)) {
			this.spamCounter.push({
				time: Date.now(),
				user: msg.author.id,
				cmd: msg.cmd.cmd.triggers[0]
			});

			const sp = [...this.spamCounter.filter(s => s.user === msg.author.id)];
			let spC = sp.length;
			if (sp.length >= config.antiSpam.cmd.start && sp.length % config.antiSpam.cmd.warning === 0) {
				let report: any = {
					userTag: msg.author.tag,
					userId: msg.author.id,
					generatedTimestamp: Date.now(),
					entries: sp.map(s => ({ cmd: s.cmd, time: s.time })),
					type: "cmd",
					beta: config.beta
				};

				const d = fs.readdirSync(`${config.logsDir}/spam`).filter(d => !fs.lstatSync(`${config.logsDir}/spam/${d}`).isDirectory() && d.startsWith(msg.author.id) && d.endsWith("-cmd.json") && fs.lstatSync(`${config.logsDir}/spam/${d}`).birthtimeMs + 1.2e5 > Date.now());

				if (d.length > 0) {
					report = this.f.combineReports(...d.map(f => JSON.parse(fs.readFileSync(`${config.logsDir}/spam/${f}`).toString())), report);
					spC = report.entries.length;
					d.map(f => fs.unlinkSync(`${config.logsDir}/spam/${f}`));
				}

				const reportId = this.f.random(10);

				fs.writeFileSync(`${config.logsDir}/spam/${msg.author.id}-${reportId}-cmd.json`, JSON.stringify(report));

				Logger.log(`Shard #${msg.guild.shard.id} | Command Handler`, `Possible command spam from "${msg.author.tag}" (${msg.author.id}), VL: ${spC}, Report: ${config.beta ? `https://${config.apiBindIp}/reports/cmd/${msg.author.id}/${reportId}` : `https://botapi.furry.bot/reports/cmd/${msg.author.id}/${reportId}`}`);
				await this.executeWebhook(config.webhooks.logs.id, config.webhooks.logs.token, {
					embeds: [
						{
							title: `Possible Command Spam From ${msg.author.tag} (${msg.author.id}) | VL: ${spC}`,
							description: `Report: ${config.beta ? `https://${config.apiBindIp}/reports/cmd/${msg.author.id}/${reportId}` : `https://botapi.furry.bot/reports/cmd/${msg.author.id}/${reportId}`}`
						}
					],
					username: `Furry Bot Spam Logs${config.beta ? " - Beta" : ""}`,
					avatarURL: "https://assets.furry.bot/blacklist_logs.png"
				});

				if (spC >= config.antiSpam.cmd.blacklist) {
					await msg.uConfig.edit({
						blacklist: {
							blacklisted: true,
							reason: `Spamming Commands. Automatic Blacklist.`,
							blame: "Automatic"
						}
					});

					Logger.log(`Shard #${msg.guild.shard.id} | Command Handler`, `User "${msg.author.tag}" (${msg.author.id}) blacklisted for spamming, VL: ${spC}, Report: ${config.beta ? `https://${config.apiBindIp}/reports/cmd/${msg.author.id}/${reportId}` : `https://botapi.furry.bot/reports/cmd/${msg.author.id}/${reportId}`}`);
					await this.executeWebhook(config.webhooks.logs.id, config.webhooks.logs.token, {
						embeds: [
							{
								title: "User Blacklisted",
								description: `Id: ${msg.author.id}\nTag: ${msg.author.tag}\nReason: Spamming Commands. Automatic Blacklist.\nReport: ${config.beta ? `https://${config.apiBindIp}/reports/cmd/${msg.author.id}/${reportId}` : `https://botapi.furry.bot/reports/cmd/${msg.author.id}/${reportId}`}\nBlame: Automatic`,
								timestamp: new Date().toISOString(),
								color: this.f.randomColor()
							}
						],
						username: `Blacklist Logs${config.beta ? " - Beta" : ""}`,
						avatarURL: "https://assets.furry.bot/blacklist_logs.png"
					});
				}
			}
		}

		this.increment(
			`commands.${cmd.triggers[0].toLowerCase()}`,
			[
				`shardId:${msg.channel.guild.shard.id}`
			]
		);
		this.commandStats[cmd.triggers[0]]++;

		if (cmd.features.includes("betaOnly") && !config.beta) return;

		if (cmd.features.includes("devOnly") && !config.developers.includes(msg.author.id)) {
			Logger.debug(`Shard #${msg.channel.guild.shard.id}`, `${msg.author.tag} (${msg.author.id}) attempted to run developer command "${cmd.triggers[0]}" in guild ${msg.channel.guild.name} (${msg.channel.guild.id})`);
			this.increment(`commands.${cmd.triggers[0].toLowerCase()}.missingPermissions`, ["missing:dev"]);
			return msg.reply(`you must be a developer to use this command.`);
		}

		if (cmd.features.includes("guildOwnerOnly") && msg.author.id !== msg.channel.guild.ownerID) return msg.reply("only this servers owner may use this command.");

		if (cmd.features.includes("nsfw")) {
			if (!msg.channel.nsfw) return msg.reply(`this command can only be ran in nsfw channels.`, {
				file: await this.f.getImageFromURL("https://assets.furry.bot/nsfw.gif"),
				name: "nsfw.gif"
			});

			if (!msg.gConfig.settings.nsfw) return msg.reply(`nsfw commands are not enabled in this server. To enable them, have an administrator run \`${msg.gConfig.settings.prefix}settings nsfw enable\`.`);

			if (msg.channel.topic && config.yiff.disableStatements.some(t => msg.channel.topic.indexOf(t) !== -1)) {
				const st = config.yiff.disableStatements.filter(t => msg.channel.topic.indexOf(t) !== -1);
				st.map(k => this.increment("other.nsfwDisabled", [`statment:${k}`]));

				const embed: Eris.EmbedOptions = {
					author: {
						name: msg.author.tag,
						icon_url: msg.author.avatarURL
					},
					title: "NSFW Commands Disabled",
					description: `NSFW commands have been explicitly disabled in this channel. To reenable them, remove **${st.join("**, **")}** from the channel topic.`,
					color: Math.floor(Math.random() * 0xFFFFFF),
					timestamp: new Date().toISOString()
				};

				return msg.channel.createMessage({ embed });
			}
		}

		if (cmd.userPermissions.length > 0 && !config.developers.includes(msg.author.id)) {
			if (cmd.userPermissions.some(perm => !msg.channel.permissionsOf(msg.author.id).has(perm))) {
				const p = cmd.userPermissions.filter(perm => !msg.channel.permissionsOf(msg.author.id).has(perm));

				const embed: Eris.EmbedOptions = {
					title: "You do not have the required permission(s) to use this!",
					description: `You require the permission(s) **${p.join("**, **")}** to run this, which you do not have.`,
					color: this.f.randomColor(),
					timestamp: new Date().toISOString()
				};
				Logger.debug(`Shard #${msg.channel.guild.shard.id}`, `user ${msg.author.username}#${msg.author.discriminator} (${msg.author.id}) is missing the permission(s) ${p.join(", ")} to run the command ${cmd.triggers[0]}`);
				return msg.channel.createMessage({ embed });
			}
		}

		if (cmd.botPermissions.length > 0) {
			if (cmd.botPermissions.some(perm => !msg.channel.permissionsOf(this.user.id).has(perm))) {
				const p = cmd.botPermissions.filter(perm => !msg.channel.permissionsOf(this.user.id).has(perm));

				const embed: Eris.EmbedOptions = {
					title: "I do not have the required permission(s) to use this!",
					description: `I need the permission(s) **${p.join("**, **")}** for this command to function properly, please add these to me and try again.`,
					color: this.f.randomColor(),
					timestamp: new Date().toISOString()
				};

				Logger.debug(`Shard #${msg.channel.guild.shard.id}`, `I am missing the permission(s) ${p.join(", ")} for the command ${cmd.triggers[0]}, server: ${(msg.channel as Eris.TextChannel).guild.name} (${(msg.channel as Eris.TextChannel).guild.id})`);
				return msg.channel.createMessage({ embed }).catch(err => null);
			}
		}

		if (!config.developers.includes(msg.author.id)) {
			const cool = this.cmd.cool.checkCooldown(cmd, msg.author.id);
			const time = cool.time < 1000 ? 1000 : Math.round(cool.time / 1000) * 1000;
			if (cool.c && cmd.cooldown !== 0 && cool.time !== 0) {
				let t = await this.f.ms(time, true) as string;
				t = t.split(" ").slice(0, 2).join(" ").replace(",", "");
				return msg.reply(`hey, this command is on cooldown! Please wait **${t}**..`);
			}
		}

		if (cmd.cooldown !== 0 && !config.developers.includes(msg.author.id)) this.cmd.cool.setCooldown(cmd, null, msg.author.id);

		Logger.log(`Shard #${msg.channel.guild.shard.id}`, `Command "${cmd.triggers[0]}" ran with the arguments "${msg.args.join(" ")}" by user ${msg.author.tag} (${msg.author.id}) in guild ${msg.channel.guild.name} (${msg.channel.guild.id})`);

		t.start("cmd");
		const c = await cmd.run.call(this, msg, cmd).catch(err => err);
		t.end("cmd");
		Logger.debug(`Shard #${msg.channel.guild.shard.id}`, `Command handler for "${cmd.triggers[0]}" took ${t.calc("cmd", "cmd")}ms`);
		if (cmd.triggers[0] !== "eval" && msg.channel.isTyping) await msg.channel.stopTyping();
		if (c instanceof Error) throw c;
		t.end("main");
	} catch (e) {
		const err: Error = e; // typescript doesn't allow annotating of catch clause variables, TS-1196
		const cmd = msg.cmd !== null ? msg.cmd.cmd : null;
		if (!["ERR_INVALID_USAGE", "RETURN"].includes(err.message)) Logger.error(`Shard #${msg.channel.guild.shard.id}`, err);
		if (!cmd) return;
		switch (err.message) {
			case "ERR_INVALID_USAGE":
				const embed: Eris.EmbedOptions = {
					title: ":x: Invalid Command Usage",
					fields: [
						{
							name: "Command",
							value: cmd.triggers[0],
							inline: false
						},
						{
							name: "Usage",
							value: `\`${msg.gConfig.settings.prefix}${cmd.triggers[0]} ${cmd.usage}\``,
							inline: false
						},
						{
							name: "Description",
							value: cmd.description || "No Description Found.",
							inline: false
						},
						{
							name: "Category",
							value: cmd.category,
							inline: false
						},
						{
							name: "Arguments",
							value: msg.args.length < 1 ? "NONE" : msg.args.join(" "),
							inline: false
						}
					],
					color: 13434880,
					author: {
						name: msg.author.tag,
						icon_url: msg.author.avatarURL
					}
				};
				return msg.channel.createMessage({ embed }).catch(err => null);
				break;

			case "RETURN": return; break;

			default:
				Logger.error(`Shard #${msg.channel.guild.shard.id}`, err);
				if (msg.channel.permissionsOf(this.user.id).has("attachFiles")) return msg.reply(`there was an error while doing something:\n${err.name}: ${err.message}`, {
					file: await this.f.getImageFromURL(config.images.serverError),
					name: "error.png"
				}).catch(err => null);
				else return msg.reply(`there was an error while doing something:\n${err.name}: ${err.message}`).catch(err => null);
		}
	}
}));