interface MsResponse {
	ms: number;
	s: number;
	m: number;
	h: number;
	d: number;
	w: number;
	mn: number;
	y: number;
}


export default class Time {
	private constructor() {
		throw new TypeError("This class may not be instantiated, use static methods.");
	}

	/**
	 * Convert milliseconds into readable time.
	 *
	 * @static
	 * @param {number} time - The time to convert.
	 * @param {boolean} [words=false] - If we should return full words or just letters.
	 * @returns {(Promise<string | T.MsResponse>)}
	 * @memberof Time
	 * @example Time.ms(120000);
	 * @example Time.ms(240000, true);
	 */
	static ms(time: number, words?: true, seconds?: boolean): string;
	static ms(time: number, words?: false, seconds?: boolean): MsResponse;
	static ms(time: number, words = false, seconds = true): string | MsResponse {
		if (time < 0) throw new TypeError("Negative time provided.");
		// @FIXME language :sweats:
		if (time === 0) return words ? "0 seconds" : "0s";
		const r = {
			s: 0,
			m: 0,
			h: 0,
			d: 0,
			w: 0,
			mn: 0,
			y: 0
		};

		while (time >= 1e3) {
			r.s++; time -= 1e3;
		}
		while (r.s >= 60) {
			r.m++; r.s -= 60;
		}
		while (r.m >= 60) {
			r.h++; r.m -= 60;
		}
		while (r.h >= 24) {
			r.d++; r.h -= 24;
		}
		// while (r.d >= 7) { r.w++; r.d -= 7; }
		// while (r.w >= 4 && r.d >= 2) { r.mn++; r.w -= 4; r.d -= 2; }
		while (r.d >= 30) {
			r.mn++; r.d -= 30;
		}
		while (r.mn >= 12) {
			r.y++; r.mn -= 12;
		}
		if (time > 0) r.s += time / 1000;

		Object.keys(r).map(k => r[k] = Math.floor(r[k]));

		const str: string[] = [];
		if (r.s > 0) str.push(`${r.s} second${r.s === 1 ? "" : "s"}`);
		if (r.m > 0) str.push(`${r.m} minute${r.m === 1 ? "" : "s"}`);
		if (r.h > 0) str.push(`${r.h} hour${r.h === 1 ? "" : "s"}`);
		if (r.d > 0) str.push(`${r.d} day${r.d === 1 ? "" : "s"}`);
		// if (r.w > 0) str.push(`${r.w} week${r.w === 1 ? "" : "s"}`);
		if (r.mn > 0) str.push(`${r.mn} month${r.mn === 1 ? "" : "s"}`);
		if (r.y > 0) str.push(`${r.y} year${r.y === 1 ? "" : "s"}`);

		if (words && str.length > 1) str[0] = `and ${str[0]}`;

		if (!seconds) {
			if (words) {
				const e = str.find(v => v.indexOf("second") !== -1);
				if (e) {
					str.splice(str.indexOf(e), 1);
					if (str.length < 1) str.push("less than 1 minute");
				}
			} else {
				delete r.s;
			}
		}

		return words ? str.reverse().join(", ") : Object.keys(r).filter(k => r[k] > 0).map(k => `${Math.floor(r[k])}${k}`).reverse().reduce((a, b) => a + b, "");
	}

	/**
	 * Format milliseconds ago.
	 *
	 * @static
	 * @param {(number | Date)} t - The milliseconds to format.
	 * @param {boolean} [sub] - If we should sub the ms provided from the current time.
	 * @param {boolean} [seconds] - If seconds should be included in the return.
	 * @returns {string}
	 * @memberof Time
	 * @example()
	 */
	static formatAgo(t: number | Date, sub?: boolean, seconds?: boolean) {
		if (t instanceof Date) t = t.getTime();
		if (sub) t = Date.now() - t;
		return `${Time.ms(t, true, seconds)} ago`;
	}

	/**
	 * format a date into dd/mm/yyyy hh:mm:ss.ms
	 *
	 * @static
	 * @param {(Date | number)} [d=new Date()] - The date to format.
	 * @param {boolean} [hms=true] - If hh:mm:ss should be returned.
	 * @param {boolean} [ms=false] - If ms should be returned.
	 * @returns {string}
	 * @memberof Time
	 * @example Time.formatDateWithPadding();
	 * @example Time.formatDateWithPadding(new Date());
	 * @example Time.formatDateWithPadding(new Date(), true);
	 * @example Time.formatDateWithPadding(new Date(), true, true);
	 */
	static formatDateWithPadding(d: Date | number = new Date(), hms = true, ms = false, words = false, useLang = false) {
		const months = [
			"January", "February", "March", "April",
			"May", "June", "July", "August",
			"September", "October", "November", "December"
		];
		const days = [
			"Sunday", "Monday", "Tuesday",
			"Wednesday", "Thursday", "Friday",
			"Saturday"
		];
		if (typeof d === "number") d = new Date(d);
		if (words) return `${useLang ? `{lang:other.dayOfWeek.${d.getDay()}}` : days[d.getDay()]} ${useLang ? `{lang:other.months.${d.getMonth()}}` : months[d.getMonth()]} ${(d.getDate()).toString().padStart(2, "0")}, ${d.getFullYear()} ${d.getHours() % 12} ${useLang ? `{lang:other.words.${d.getHours() < 12 ? "am" : "pm"}$upper$}` : d.getHours() < 12 ? "AM" : "PM"}`;
		else return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${(d.getDate()).toString().padStart(2, "0")}/${d.getFullYear()}${hms ? ` ${(d.getHours()).toString().padStart(2, "0")}:${(d.getMinutes()).toString().padStart(2, "0")}:${(d.getSeconds()).toString().padStart(2, "0")}` : ""}${ms ? `.${(d.getMilliseconds()).toString().padStart(3, "0")}` : ""}`;
	}

	/**
	 * Convert seconds to HH:MM:SS
	 *
	 * @static
	 * @param {number} sec - The seconds to convert.
	 * @returns {string}
	 * @memberof Time
	 * @example Time.secondsToHMS(1800);
	 */
	static secondsToHMS(sec: number) {
		let hours: string | number = Math.floor(sec / 3600);
		let minutes: string | number = Math.floor((sec - (hours * 3600)) / 60);
		let seconds: string | number = Math.floor(sec - (hours * 3600) - (minutes * 60));

		if (hours < 10) hours = `0${hours}`;
		if (minutes < 10) minutes = `0${minutes}`;
		if (seconds < 10) seconds = `0${seconds}`;
		return `${hours}:${minutes}:${seconds}`;
	}
}
