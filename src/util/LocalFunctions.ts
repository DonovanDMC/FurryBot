import FurryBot from "../main";
import config from "../config";
import { Colors, defaultEmojis, EmbedBuilder, ExtendedMessage, GuildConfig, UserConfig } from "core";
import Eris from "eris";
import { Request, Time } from "utilities";
import fetch, { Response } from "node-fetch";
import Logger from "logger";
import crypto from "crypto";

export default class LocalFunctions {
	/**
	 * Log an error
	 *
	 * @static
	 * @param {FurryBot} client - The bot client.
	 * @param {Error} err - The error instance.
	 * @param {("event" | "message")} type - The error type.
	 * @param {any} extra - Extra info to provide.
	 * @returns {LogErrorResult}
	 * @memberof Utility
	 * @example Utility.logError(<Client>, new Error(), "event", {});
	 * @example Utility.logError(<Client>, new Error(), "message", <ExtendedMessage>);
	 */
	// eslint-disable-next-line @typescript-eslint/ban-types
	static async logError(client: FurryBot, err: Error, type: "event", extra: {}): Promise<{
		message: Eris.Message<Eris.TextableChannel>;
		code: string;
	}>;
	static async logError(client: FurryBot, err: Error, type: "message", extra: ExtendedMessage<FurryBot, UserConfig, GuildConfig>): Promise<{
		message: Eris.Message<Eris.TextableChannel>;
		code: string;
	}>;
	// eslint-disable-next-line @typescript-eslint/ban-types
	static async logError(client: FurryBot, err: Error, type: "message" | "event", extra?: ExtendedMessage<FurryBot, UserConfig, GuildConfig> | {}): Promise<{
		message: Eris.Message<Eris.TextableChannel>;
		code: string;
	}> {
		if ([
			1001,
			1006,
			1012,
			"ERR_INVALID_USAGE",
			"Connection reset by peer",
			"Missing Permissions",
			"Missing Access",
			"'tags' conatins a tag that is listed in 'filterTags'"
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
		].some(v => err.message.indexOf(v.toString()) !== -1)) return { message: { embeds: [] } as any, code: "" };

		const d = new Date();
		const code = `err.${config.beta ? "beta" : "prod"}.${crypto.randomBytes(8).toString("hex")}`;
		const p = await Request.createPaste(err.stack!, "Furry Bot Error", "1W", 2);
		const e = new EmbedBuilder(config.devLanguage)
			.setTitle("\u274c Error")
			.setTimestamp(d)
			.setColor(Colors.red)
			.setDescription([
				"**Error:**",
				`${defaultEmojis.dot} Stack: ${p}`,
				`${defaultEmojis.dot} Error Name: ${err.name}`,
				`${defaultEmojis.dot} Error Message: ${err.message}`,
				`${defaultEmojis.dot} Code: \`${code || "None"}\``
			].join("\n"));

		switch (type) {
			case "event": {
				e.setDescription([
					e.getDescription(),
					"",
					"**Other Info:**",
					`${defaultEmojis.dot} Time: **${Time.formatDateWithPadding(d)}**`
				].join("\n"));
				break;
			}

			case "message": {
				const v = extra as ExtendedMessage<FurryBot, UserConfig, GuildConfig>;
				const ch = v.channel as Eris.GuildTextableChannel;
				e.setDescription([
					e.getDescription(),
					"",
					"**Other Info:**",
					`${defaultEmojis.dot} Message Content: **${v.content}**`,
					`${defaultEmojis.dot} Message ID: **${v.id}**`,
					`${defaultEmojis.dot} Channel: **${ch.name}**`,
					`${defaultEmojis.dot} Channel ID: **${ch.id}**`,
					`${defaultEmojis.dot} Guild: **${ch.guild.name}**`,
					`${defaultEmojis.dot} Guild ID: **${ch.guild.id}**`,
					`${defaultEmojis.dot} Cluster: **#${client.clusterId}**`,
					`${defaultEmojis.dot} Shard: **#${ch.guild.shard.id}**`,
					`${defaultEmojis.dot} Time: **${Time.formatDateWithPadding(d)}**`
				].join("\n"));
				break;
			}
		}

		const message = await client.w.get("errors")!.execute({
			embeds: [
				e.toJSON()
			]
		});

		return {
			message,
			code
		};
	}

	static calcExp(lvl: number) {
		const k = {
			lvl: lvl < config.leveling.flatRateStart ? lvl * 100 : config.leveling.flatRate,
			total: 0
		};
		if (lvl <= config.leveling.flatRateStart) for (let i = 0; i <= lvl; i++) k.total += i < config.leveling.flatRateStart ? i * 100 : config.leveling.flatRate;
		else {
			const { total: t } = this.calcExp(config.leveling.flatRateStart);
			k.total = t + (lvl - config.leveling.flatRateStart) * config.leveling.flatRate;
		}
		return k;
	}

	static calcLevel(exp: number) {
		let e = Number(exp), lvl = 0, complete = false;
		const { total: t } = this.calcExp(config.leveling.flatRateStart);
		if (exp <= t) {
			while (!complete) {
				const l = this.calcExp(lvl + 1).lvl;
				if (e >= l) {
					e -= l;
					lvl++;
				} else complete = true;
			}
		} else {
			// leftover exp after level 20
			const l = exp - t;
			// leftover exp
			const a = l % config.leveling.flatRate;
			// levels above 20
			const b = Math.floor(l / config.leveling.flatRate);
			lvl = b + config.leveling.flatRateStart;
			e = a;
		}

		return {
			level: lvl,
			total: exp,
			leftover: e,
			needed: this.calcExp(lvl + 1).lvl - e
		};
	}

	static getBlacklistTime(type: keyof typeof config["bl"], amount: number, addOne?: boolean, addTime?: boolean) {
		const d = Date.now();
		if (addOne) amount++;
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const t = config.bl[type][amount as 1];
		return !t ? 0 : addTime ? Number(t) + d : t;
	}

	/**
	 * @typedef {object} SpamReport
	 * @param {string} userTag
	 * @param {string} userId
	 * @param {number} generatedTimestamp
	 * @param {("cmd")} type
	 * @param {boolean} beta
	 * @param {object[]} entries
	 * @param {number} entries.time
	 * @param {string} entries.cmd
	 */

	/**
	 * Combine multiple spam reports into one report.
	 *
	 * @static
	 * @param {SpamReport[]} reports
	 * @returns {SpamReport}
	 * @memberof LocalFunctions
	 * @example LocalFunctions.combineReports(<SpamReport[]>);
	 */
	static combineReports(...reports: Array<{
		userTag: string;
		userId: string;
		generatedTimestamp: number;
		type: "cmd";
		beta: boolean;
		entries: Array<{
			time: number;
			cmd: string;
		}>;
	}>): {
			userTag: string;
			userId: string;
			generatedTimestamp: number;
			type: "cmd";
			beta: boolean;
			entries: Array<{
				time: number;
				cmd: string;
			}>;
		} {
		if (Array.from(new Set(reports.map(r => r.userId))).length > 1) throw new TypeError("Cannot combine reports of different users.");
		if (Array.from(new Set(reports.map(r => r.type))).length > 1) throw new TypeError("Cannot combine reports of different types.");
		if (Array.from(new Set(reports.map(r => r.beta))).length > 1) throw new TypeError("Cannot combine beta, and non-beta reports.");

		// eslint-disable-next-line
		const entries: any = Array.from(new Set(reports.map(r => r.entries as any).reduce((a, b) => a.concat(b)).map((r: any) => JSON.stringify(r)))).map(r => JSON.parse(r as string));
		return {
			userTag: reports[0].userTag,
			userId: reports[0].userId,
			generatedTimestamp: Date.now(),
			type: reports[0].type,
			beta: reports[0].beta,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			entries
		};
	}

	static getExt() {
		return __filename.split(".").slice(-1)[0];
	}

	/**
	 * Make a request to api.chewy-bot.top.
	 *
	 * @static
	 * @param {string} cat - The category to fetch from.
	 * @returns {Promise<string>}
	 * @memberof LocalFunctions
	 * @example LocalFunctions.chewyBotAPIRequest("bunny");
	 */
	static async chewyBotAPIRequest(cat: string): Promise<string> {
		let r: Response;
		try {
			r = await fetch(`https://api.chewey-bot.top/${cat}`, {
				method: "GET",
				headers: {
					"User-Agent": config.web.userAgent,
					"Authorization": config.apis.chewyBot
				},
				timeout: 5e3
			});
			return r.text();
		} catch (e) { // cannot annotate try-catch clauses
			const err = e as Error;
			Logger.error("Request", `${r!.status} ${r!.statusText}`);
			Logger.error("Request", err);
			throw err;
		}
	}

	static randomColor() {
		return Math.floor(Math.random() * 0xFFFFFF);
	}
}
