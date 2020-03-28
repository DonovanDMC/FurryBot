import config from "../../config";
import { mdb } from "../Database";
import { DeepPartial } from "../../util/@types/Misc";

interface Warning {
	blame: string;
	gid: string;
	reason: string;
	timestamp: Date;
	wid: number;
}

export default class UserConfig {
	id: string;
	marriage: {
		married: boolean;
		partner: string;
	};
	warnings: Warning[];
	bal: number;
	tips: boolean;
	dmActive: boolean;
	preferences: {
		mention: boolean;
	};
	levels: {
		[k: string]: number;
	};

	constructor(id: string, data: DeepPartial<{ [K in keyof UserConfig]: UserConfig[K]; }>) {
		this.id = id;
		if (!data) data = config.defaults.config.user;
		this.load.call(this, data);
	}

	async load(data: DeepPartial<{ [K in keyof UserConfig]: UserConfig[K]; }>) {
		/**
		 *
		 *
		 * @template A
		 * @template B
		 * @template C
		 * @param {A} a - the object to get keys from
		 * @param {B} b - default
		 * @param {C} c - set data
		 */
		function goKeys<A extends {}, B extends {}, C extends {}>(a: A, b: B, c: C) {
			Object.keys(b).map(k => typeof a[k] === "undefined" ? c[k] = b[k] : a[k] instanceof Array ? c[k] = a[k] : typeof a[k] === "object" && a[k] !== null /* because typeof null is object */ ? (c[k] = {}, goKeys(a[k], b[k], c[k])) : c[k] = a[k]);
		}
		goKeys(data, config.defaults.config.user, this);
	}

	async reload() {
		const r = await mdb.collection("users").findOne({ id: this.id });
		this.load.call(this, r);
		return this;
	}

	async edit(data: DeepPartial<{ [K in keyof UserConfig]: UserConfig[K]; }>) {
		const d = this;

		function goKeys<A extends {}, B extends {}>(a: A, b: B) {
			Object.keys(a).map(k => typeof a[k] === "object" && a[k] !== null /* because typeof null is object */ ? goKeys(a[k], b[k]) : b[k] = a[k]);
		}
		goKeys(data, d);

		const e = await mdb.collection("users").findOne({
			id: this.id
		});

		if (!e) await mdb.collection("users").insertOne({
			id: this.id, ...d
		});
		else await mdb.collection("users").findOneAndUpdate({
			id: this.id
		}, {
			$set: d
		});

		return this.reload();
	}

	async create() {
		const e = await mdb.collection("users").findOne({
			id: this.id
		});
		if (!e) await mdb.collection("users").insertOne({
			id: this.id,
			...config.defaults.config.guild
		});

		return this;
	}

	async delete() {
		await mdb.collection("users").findOneAndDelete({ id: this.id });
	}

	async reset() {
		await this.delete();
		await this.create();
		return this.reload();
	}

	async premiumCheck(): Promise<GlobalTypes.PremiumUserEntry> {
		const r = await mdb.collection("premium").find<GlobalTypes.PremiumUserEntry>({ userId: this.id }).toArray();
		if (!r || r.length === 0) return {
			type: "user",
			userId: this.id,
			amount: 0,
			active: false,
			activationDate: null,
			patronId: null
		};
		else return r[0];
	}

	getLevel(g: string) {
		return this.levels[g] || 0;
	}
}
