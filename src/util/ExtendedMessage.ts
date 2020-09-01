import Eris from "eris";
import FurryBot from "../bot";
import { db } from "./Database";
import GuildConfig from "./config/GuildConfig";
import UserConfig from "./config/UserConfig";
import Command from "./cmd/Command";
import config from "../config";
import GuildMusicHandler from "./handlers/music/GuildMusicHandler";

export default class ExtendedMessage {
	#client: FurryBot;
	#msg: Eris.Message<Eris.GuildTextableChannel> & {
		author: Eris.User & { tag: string; };
		member: Eris.Member & { tag: string; };
		channel: Eris.GuildTextableChannel & {
			guild: Eris.Guild & {
				readonly me: Eris.Member;
				readonly music: GuildMusicHandler;
			};
		};
	};
	#gConfig: GuildConfig;
	#uConfig: UserConfig;
	#args: string[];
	#cmd: Command;
	#prefix: string;
	#dashedArgs: {
		value: string[];
		keyValue: {
			[k: string]: string;
		};
	};
	constructor(msg: Eris.Message<Eris.GuildTextableChannel>, client: FurryBot) {
		this.#msg = msg as any;
		this.#client = client;

		if (!this.#msg.author.tag) Object.defineProperty(this.#msg.author, "tag", {
			get() { return `${this.username}#${this.discriminator}`; }
		});

		if (!this.#msg.member.tag) Object.defineProperty(this.#msg.member, "tag", {
			get() { return `${this.user.username}#${this.user.discriminator}`; }
		});

		if (!this.#msg.channel.guild.me) Object.defineProperty(this.#msg.channel.guild, "me", {
			get() { return this.members.get(this._client.user.id); }
		});

		/*if (!this.#msg.channel.guild.music) Object.defineProperty(this.#msg.channel.guild, "music", {
			get() { return this._client.music.get(this.id); }
		});*/
	}

	get id() { return this.#msg.id; }
	get delete() { return this.#msg.delete.bind(this.#msg); }
	get edit() { return this.#msg.edit.bind(this.#msg); }
	get author() { return this.#msg.author; }
	get member() { return this.#msg.member; }
	get channel() { return this.#msg.channel; }
	get content() { return this.#msg.content; }
	get mentions() {
		return {
			channels: this.#msg.channelMentions.map(c => this.#msg.channel.guild.channels.get(c) as Eris.GuildTextableChannel || null).filter(c => c),
			channelsRaw: this.#msg.channelMentions,
			roles: this.#msg.roleMentions.map(r => this.#msg.channel.guild.roles.get(r) || null).filter(r => r),
			rolesRaw: this.#msg.roleMentions,
			users: this.#msg.mentions,
			usersRaw: this.#msg.mentions.map(u => u.id),
			members: this.#msg.mentions.map(m => this.#msg.channel.guild.members.get(m.id) || null).filter(m => m),
			membersRaw: this.#msg.mentions.map(m => m.id)
		};
	}

	get gConfig() { return this.#gConfig; }
	get uConfig() { return this.#uConfig; }
	get args() { return this.#args; }
	set args(a: string[]) { this.#args = a; }
	get dashedArgs() { return this.#dashedArgs; }
	get cmd() { return this.#cmd; }
	get prefix() { return this.#prefix; }
	get timestamp() { return this.#msg.timestamp; }
	get music() { return this.#msg.channel.guild.music; }

	async load() {
		const g = this.#gConfig = await db.getGuild(this.channel.guild.id);
		const u = this.#uConfig = await db.getUser(this.author.id);
		const p = this.#msg.content.match(new RegExp(`(${g.settings.prefix}|<@!?${this.#client.bot.user.id}>)(?:\s+)*`, "i"));
		if (!p || p.length === 0) return false;
		const prefix = this.#prefix = p[1].toLowerCase();
		if (!this.#msg.content.toLowerCase().startsWith(prefix)) return false;
		const args = this.#args = this.#msg.content.slice(prefix.length).split(" ").filter(a => a.length > 0 && !a.match(/^--(.{1,})(?:=(.*))?$/));
		const c = args.splice(0, 1)[0]?.toLowerCase();
		const cmd = this.#cmd = !c ? null : this.#client.cmd.getCommand(c).cmd;
		const d = this.#dashedArgs = {
			value: this.#msg.content.slice(prefix.length).split(" ").map(a => a.match(new RegExp("^--([^=].{1,})$"))).map(a => !a || !a[1] ? null : a[1]).filter(a => !!a),
			keyValue: this.#msg.content.slice(prefix.length).split(" ").map(a => a.match(new RegExp("^--(.{1,})=(.*)$"))).map(a => !a || a.length < 3 ? null : ({ [a[1]]: a[2] })).filter(a => !!a).reduce((a, b) => ({ ...a, ...b }), {})
		};
		return true;
	}

	async getUserFromArgs(argPos?: number, useMentions?: boolean, mentionPos?: number): Promise<Eris.User> {
		argPos = [undefined, null].includes(argPos) ? 0 : argPos;
		useMentions = [undefined, null].includes(useMentions) ? true : useMentions;
		mentionPos = [undefined, null].includes(mentionPos) ? argPos : mentionPos;
		if (useMentions && this.mentions.users[mentionPos]) return this.mentions.users[mentionPos];
		if (!this.args || !this.args[argPos]) return null;
		const t = this.args[argPos].toLowerCase();

		const username = this.#client.bot.users.find(u => u.username.toLowerCase() === t);
		const tag = this.#client.bot.users.find(u => `${u.username}#${u.discriminator}`.toLowerCase() === t);
		const mention: string = this.args[argPos].match(/<@!?([0-9]{15,21})>/g) as any; // apparently there's no specific type for global matches
		let id: Eris.User;
		if (/[0-9]{15,21}/.test(t)) {
			id = this.#client.bot.users.find(u => u.id === this.args[argPos]);
			if (!id) id = await this.#client.bot.getRESTUser(t).catch(err => null);
			if (id) this.#client.bot.users.add(id);
		}

		if (mention && !id) {
			id = this.#client.bot.users.find(u => u.id === mention);
			if (!id) id = await this.#client.bot.getRESTUser(mention).catch(err => null);
			if (id) this.#client.bot.users.add(id);
		}

		return username || tag || id || null;
	}

	async getMemberFromArgs(argPos?: number, useMentions?: boolean, mentionPos?: number): Promise<Eris.Member> {
		argPos = [undefined, null].includes(argPos) ? 0 : argPos;
		useMentions = [undefined, null].includes(useMentions) ? true : useMentions;
		mentionPos = [undefined, null].includes(mentionPos) ? argPos : mentionPos;
		if (useMentions && this.mentions.members[mentionPos]) return this.mentions.members[mentionPos];
		if (!this.args || !this.args[argPos]) return null;
		const t = this.args[argPos].toLowerCase();

		const username = this.channel.guild.members.find(m => m.username.toLowerCase() === t);
		const tag = this.channel.guild.members.find(m => `${m.username}#${m.discriminator}`.toLowerCase() === t);
		let id: Eris.Member;
		if (/[0-9]{15,21}/.test(t)) {
			id = this.channel.guild.members.find(m => m.id === this.args[argPos]);
			if (!id) {
				id = await this.channel.guild.getRESTMember(t).catch(err => null);
				if (id) this.channel.guild.members.add(id);
			}
		}

		return username || tag || id || null;
	}

	async getChannelFromArgs<T extends Eris.GuildTextableChannel = Eris.TextChannel>(argPos?: number, useMentions?: boolean, mentionPos?: number): Promise<T> {
		argPos = [undefined, null].includes(argPos) ? 0 : argPos;
		useMentions = [undefined, null].includes(useMentions) ? true : useMentions;
		mentionPos = [undefined, null].includes(mentionPos) ? argPos : mentionPos;
		if (useMentions && this.mentions.channels[mentionPos]) return this.mentions.channels[mentionPos] as T;
		if (!this.args || !this.args[argPos]) return null;
		const t = this.args[argPos].toLowerCase();

		const name = this.channel.guild.channels.find(c => c.name.toLowerCase() === t) as T;
		let id: T;
		if (/[0-9]{15,21}/.test(t)) {
			id = this.channel.guild.channels.find(c => c.id === this.args[argPos]) as T;
			if (!id) id = await this.#client.bot.getRESTChannel(t).catch(err => null) as T;
		}

		return name || id || null;
	}

	async getRoleFromArgs(argPos?: number, useMentions?: boolean, mentionPos?: number): Promise<Eris.Role> {
		argPos = [undefined, null].includes(argPos) ? 0 : argPos;
		useMentions = [undefined, null].includes(useMentions) ? true : useMentions;
		mentionPos = [undefined, null].includes(mentionPos) ? argPos : mentionPos;
		if (useMentions && this.mentions.roles[mentionPos]) return this.mentions.roles[mentionPos];
		if (!this.args || !this.args[argPos]) return null;
		const t = this.args[argPos].toLowerCase();

		const name = this.channel.guild.roles.find(r => r.name.toLowerCase() === t);
		let id: Eris.Role;
		if (/[0-9]{15,21}/.test(t)) {
			id = this.channel.guild.roles.find(r => r.id === this.args[argPos]);
		}

		return name || id || null;
	}

	async getReplyText(content: Eris.MessageContent, type?: "mention" | "quote" | "new", id?: string) {
		if (!type) type = config.beta ? "new" : "mention";
		if (!id) id = this.id;
		switch (type) {
			case "mention": {
				if (typeof content === "string") content = {
					content: `<@!${this.author.id}>, ${content}`
				};
				else content.content = `<@!${this.author.id}>${!content.content ? "" : `, ${content.content}`}`;
				break;
			}

			case "quote": {
				const m: Eris.Message = this.channel.messages.get(id) || await this.channel.getMessage(id).catch(err => null);
				if (!id || !m) throw new TypeError("Invalid message id provided.");
				if (typeof content === "string") content = {
					content: `> ${m.content}\n<@!${m.author.id}>, ${content}`
				};
				else content.content = `> ${m.content}\n${content.content || ""}`;
				break;
			}

			case "new": {
				const m: Eris.Message = this.channel.messages.get(id) || await this.channel.getMessage(id).catch(err => null);
				if (!id || !m) throw new TypeError("Invalid message id provided.");
				if (typeof content === "string") content = {
					content: `Replying to <@!${m.author.id}> from https://discordapp.com/channels/${this.channel.guild.id}/${this.channel.id}/${id}\n${content}`
				};
				else content.content = `Replying to <@!${m.author.id}> from https://discordapp.com/channels/${this.channel.guild.id}/${this.channel.id}/${id}\n${content.content || ""}`;
				break;
			}
		}

		return content;
	}

	async reply(content: Eris.MessageContent, type?: "mention" | "quote" | "new") {
		const text = await this.getReplyText(content, type, this.id);
		return this.channel.createMessage(text);
	}
}
