import * as os from "os";
import phin from "phin";
import config from "@config";
import * as util from "util";
import * as fs from "fs";
import Command from "@modules/cmd/Command";
import ExtendedMessage from "@src/modules/extended/ExtendedMessage";
import ExtendedTextChannel from "@src/modules/extended/ExtendedTextChannel";
import ExtendedUser from "@src/modules/extended/ExtendedUser";
import * as Eris from "eris";
import FurryBot from "@src/main";
import { mdb } from "@modules/Database";
import ErrorHandler from "@util/ErrorHandler";

// moved to separate variable as it is needed in a function here
const random = ((len: number = 10, keyset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"): string => {
    //if (len > 500 && !this[config.overrides.random]) throw new Error("Cannot generate string of specified length, please set global override to override this.");
    let rand = "";
    for (var i = 0; i < len; i++)
        rand += keyset.charAt(Math.floor(Math.random() * keyset.length));

    return rand;
});

export { ErrorHandler }

export default {
    memory: {
        process: {
            getTotal: ((): number => process.memoryUsage().heapTotal),
            getUsed: ((): number => process.memoryUsage().heapUsed),
            getRSS: ((): number => process.memoryUsage().rss),
            getExternal: ((): number => process.memoryUsage().external),
            getAll: ((): {
                total: number,
                used: number,
                rss: number,
                external: number
            } => ({
                total: process.memoryUsage().heapTotal,
                used: process.memoryUsage().heapUsed,
                rss: process.memoryUsage().rss,
                external: process.memoryUsage().external
            }))
        },
        system: {
            getTotal: ((): number => os.totalmem()),
            getUsed: ((): number => os.totalmem() - os.freemem()),
            getFree: ((): number => os.freemem()),
            getAll: ((): {
                total: number,
                used: number,
                free: number
            } => ({
                total: os.totalmem(),
                used: os.totalmem() - os.freemem(),
                free: os.freemem()
            }))
        }
    },
    checkSemVer: ((ver): boolean => require("semver").valid(ver) === ver),
    getCurrentTimestamp: ((): string => new Date().toISOString()),
    secondsToHours: ((sec: number) => {
        let hours: string | number = Math.floor(sec / 3600);
        let minutes: string | number = Math.floor((sec - (hours * 3600)) / 60);
        let seconds: string | number = Math.floor(sec - (hours * 3600) - (minutes * 60));

        if (hours < 10) hours = `0${hours}`;
        if (minutes < 10) minutes = `0${minutes}`;
        if (seconds < 10) seconds = `0${seconds}`;
        return `${hours}:${minutes}:${seconds}`;
    }),
    ucwords: ((str: string): string => str.toString().toLowerCase().replace(/^(.)|\s+(.)/g, (r) => r.toUpperCase())),
    toReadableDate: ((date: Date): string => {
        if (!(date instanceof Date)) throw new Error("must provide javascript Date object.");
        var a = date.toISOString().replace("Z", "").split("T");
        return `${a[0]} ${a[1].split(".")[0]} UTC`;
    }),
    makeSafe: ((msg: string): string => msg.replace(/\@everyone/, "@\u200Beveryone").replace(/\@here/, "@\u200Bhere")), // eslint-disable-line no-useless-escape
    ms: ((ms: number) => {
        let cd = ms / 1000;
        let cooldown;
        if (cd === 1) {
            cooldown = `${cd} second`;
        } else if (cd === 0) {
            cooldown = "none";
        } else {
            if (cd >= 60) {
                let mm = cd / 60;
                if (mm === 1) {
                    cooldown = `${mm} minute`;
                } else {
                    if (mm >= 60) {
                        let hh = mm / 60;
                        if (hh === 1) {
                            cooldown = `${hh} hour`;
                        } else {
                            if (hh >= 24) {
                                let dd = hh / 24;
                                if (dd === 1) {
                                    cooldown = `${dd} day`;
                                } else {
                                    cooldown = `${dd} days`;
                                }
                            } else {
                                cooldown = `${hh} hours`;
                            }
                        }
                    } else {
                        cooldown = `${mm} minutes`;
                    }
                }
            } else {
                cooldown = `${cd} seconds`;
            }
        }
        return cooldown;
    }),
    parseTime: ((time: number, full: boolean = false, ms: boolean = false) => {
        if (ms) var time = time / 1000;
        const methods = [
            { name: full ? " day" : "d", count: 86400 },
            { name: full ? " hour" : "h", count: 3600 },
            { name: full ? " minute" : "m", count: 60 },
            { name: full ? " second" : "s", count: 1 }
        ];

        const timeStr = [`${Math.floor(time / methods[0].count).toString()}${methods[0].name}${Math.floor(time / methods[0].count) > 1 && full ? "s" : ""}`];
        for (let i = 0; i < 3; i++) {
            timeStr.push(`${Math.floor(time % methods[i].count / methods[i + 1].count).toString()}${methods[i + 1].name}${Math.floor(time % methods[i].count / methods[i + 1].count) > 1 && full ? "s" : ""}`);
        }
        var j = timeStr.filter(g => !g.startsWith("0")).join(", ");
        if (j.length === 0) var j = "no time";
        return j;
    }),
    randomColor: ((): number => Math.floor(Math.random() * 0xFFFFFF)),
    removeDuplicates: ((array: any[]): any[] => [...new Set(array).values()]),
    processSub: (async (cmd: Command[], msg: ExtendedMessage, ctx: FurryBot) => {
        const c = cmd[cmd.length - 1];
        if (msg.args.length > 0 && c.hasSubCommands && c.subCommands.map(s => s.triggers).reduce((a, b) => a.concat(b)).includes(msg.args[0].toLowerCase())) {
            let { command: sub } = msg._client.getCommand([...cmd.map(c => c.triggers[0]), msg.args.shift().toLowerCase()]);
            msg.unparsedArgs.shift();
            const cc = sub[sub.length - 1];
            //console.log(sub);
            //console.log(sub[sub.length - 1]);
            if (msg.cmd.command instanceof Array) msg.cmd.command.push(cc);
            else msg.cmd.command = [msg.cmd.command, cc];
            //console.log(cc.triggers[0]);
            //console.log(util.inspect(cc.subCommands.find(c => c.triggers.includes(cc.triggers[0])), { depth: null, colors: true }));
            //console.log(c.subCommands.find(s => s.triggers.includes(cc.triggers[0])));
            return c.subCommands.find(s => s.triggers.includes(cc.triggers[0])).run.call(ctx, msg);
        } else return "NOSUB";
    }),
    subCmds: ((dir: string, file: string): Command[] => {
        const d = file.split(/(\\|\/)+/g).reverse()[0].split(".")[0].split("-")[0];
        if (fs.existsSync(`${dir}/${d}`)) {
            if (fs.existsSync(`${dir}/${d}/index.ts`)) return require(`${dir}/${d}/index.ts`).default;
            else {
                console.warn(`Subcommand directory found, but no index present. Attempting to auto create index..\nCommand Directory: ${dir}\nCommand File: ${file}\nSubcommand Directory: ${dir}${process.platform === "win32" ? "\\" : "/"}${d}`);
                if (fs.existsSync(`${process.cwd()}/src/default/subcmdindex.ts`)) fs.copyFileSync(`${process.cwd()}/src/default/subcmdindex.ts`, `${dir}/${d}/index.ts`);
                if (fs.existsSync(`${dir}/${d}/index.ts`)) {
                    console.debug("Auto copying worked, continuing as normal..");
                    return require(`${dir}/${d}/index.ts`).default;
                } else {
                    console.error(`Auto copying failed, please check that default/subcmdindex.ts exists, and is readable/writable, and that I can write in ${dir}${process.platform === "win32" ? "\\" : "/"}${d}`);
                }
                return [];
            }
        }
        return null;
    }),
    hasSubCmds: ((dir: string, file: string): boolean => fs.existsSync(`${dir}/${file.split(/(\\|\/)+/g).reverse()[0].split(".")[0].split("-")[0]}`)),
    sendCommandEmbed: ((msg: ExtendedMessage, cmd: Command[]) => {
        if (!msg || !(msg instanceof ExtendedMessage)) throw new TypeError("invalid message");
        if (!cmd) throw new TypeError("missing command");
        const l = cmd[cmd.length - 1];
        if (!l) throw new Error("invalid command");
        let embed;
        if (l.hasSubCommands && l.subCommands.length > 0) {
            embed = {
                title: `Subcommand List: ${msg._client.ucwords(l.triggers[0])}`,
                description: `\`command\` (\`alias\`) - description\n\n${l.subCommands.map(s => s.triggers.length > 1 ? `\`${s.triggers[0]}\` (\`${s.triggers[1]}\`) - ${s.description}` : `\`${s.triggers[0]}\` - ${s.description}`).join("\n")}`
            };
        } else {
            embed = {
                title: `Command Help: ${msg._client.ucwords(l.triggers[0])}`,
                description: `Usage: ${l.usage}\nDescription: ${l.description}`
            };
        }
        return msg.channel.createMessage({
            embed
        });
    }),
    _getCallerFile: require("./_getCallerFile"),
    _getDate: ((): string => {
        var date = new Date();
        return `${date.getMonth() + 1}-${date.getDate()}-${date.getFullYear()}`;
    }),
    getImageFromURL: (async (url: string): Promise<Buffer> => phin({ url }).then(res => res.body)),
    imageAPIRequest: (async (animal: boolean = true, category: string = null, json: boolean = true, safe: boolean = false): Promise<{
        success: boolean;
        response?: {
            image: string;
            filetype: string;
            name: string;
        };
        error?: "invalid category" | {
            code: number;
            description: string;
        }
    }> => {
        return new Promise(async (resolve, reject) => {
            let s;
            if ([undefined, null].includes(json)) json = true;

            try {
                s = await phin({
                    method: "GET",
                    url: `https://api.furry.bot/${animal ? "animals" : `furry/${safe ? "sfw" : "nsfw"}`}/${category ? category.toLowerCase() : safe ? "hug" : "bulge"}${json ? "" : "/image"}`.replace(/\s/g, ""),
                    parse: "json"
                });
                resolve(s.body);
            } catch (error) {
                reject({
                    error,
                    response: s.body
                });
            }
        });
    }),
    random,
    formatStr: ((str: string | ExtendedUser | Eris.User | Eris.Member | ExtendedTextChannel | Eris.GuildChannel, ...args: any[]): string => {
        let res;
        if (str instanceof ExtendedUser || str instanceof Eris.User || str instanceof Eris.Member) res = `<@!${str.id}>`;
        else if (str instanceof ExtendedTextChannel || str instanceof Eris.GuildChannel) res = str.name;
        else res = str.toString();
        args = args.map(a => a.toString());
        const a = res.match(/({\d})/g);
        const e = ((s) => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
        a.map((b, i) => args[i] !== undefined ? res = res.replace(new RegExp(e(b), "g"), args[i]) : null);
        return res;
    }),
    downloadImage: (async (url: string, filename: string): Promise<fs.WriteStream> =>
        phin({ url }).then(res => res.pipe(fs.createWriteStream(filename)))
    ),
    shortenURL: (async (url) => {
        mdb.listCollections().toArray().then(res => res.map(c => c.name)).then(async (list) => {
            if (!list.includes("shorturl")) {
                await mdb.createCollection("shorturl");
                this.logger.log("[ShortURL]: Created Short URL table");
            }
        });
        const create = (async (url) => {
            const rand = random(config.shortLength),
                createdTimestamp = Date.now(),
                created = new Date().toISOString(),
                count = await mdb.collection("shorturl").stats().then(res => res.count),
                a = await mdb.collection("shorturl").insertOne({
                    nsfw: url.indexOf("nsfw") !== -1,
                    id: rand,
                    url,
                    linkNumber: count + 1,
                    createdTimestamp,
                    created,
                    length: url.length,
                    link: `https://furry.services/r/${rand}`
                });
            if (!a.result.ok) {
                return create(url);
            } else {
                return {
                    nsfw: url.indexOf("nsfw") !== -1,
                    code: rand,
                    url,
                    link: `https://furry.services/r/${rand}`,
                    new: true,
                    linkNumber: count + 1,
                    createdTimestamp,
                    created,
                    length: url.length
                };
            }
        });

        let res = await mdb.collection("shorturl").find({
            url
        }).toArray();

        switch (res.length) {
            case 0: // create
                return create(url);
                break; // eslint-disable-line no-unreachable

            case 1: // return
                return res[0];
                break; // eslint-disable-line no-unreachable

            default: // delete & recreate
                this.logger.log("[ShortURL]: Duplicate records found, deleting");
                mdb.collection("shorturl").find({
                    url
                }).forEach((short) => {
                    return mdb.collection("shorturl").deleteOne({
                        id: short.id
                    });
                });
                return create(url);
        }
    }),
    memeRequest: (async (path: string, avatars: string[] | string = [], text: string = ""): Promise<phin.JsonResponse> => {
        avatars = typeof avatars === "string" ? [avatars] : avatars;
        return phin({
            method: "POST",
            url: `https://dankmemer.services/api${path}`,
            headers: {
                Authorization: config.apis.dankMemer.token,
                "User-Agent": config.userAgent,
                "Content-Type": "application/json"
            },
            data: {
                avatars,
                text
            },
            parse: "none"
        });
    }),
    compareMembers: ((member1: Eris.Member, member2: Eris.Member): {
        member1: {
            higher: boolean;
            lower: boolean;
            same: boolean;
        };
        member2: {
            higher: boolean;
            lower: boolean;
            same: boolean;
        };
    } => {
        let a = member1.roles.map(r => member1.guild.roles.get(r));
        let b: Eris.Role;
        if (a.length > 0) b = a.filter(r => r.position === Math.max.apply(Math, a.map(p => p.position)))[0];

        let c = member2.roles.map(r => member2.guild.roles.get(r));
        let d: Eris.Role;
        if (c.length > 0) d = c.filter(r => r.position === Math.max.apply(Math, c.map(p => p.position)))[0];

        if (!b && d) return {
            member1: {
                higher: false,
                lower: true,
                same: false
            },
            member2: {
                higher: true,
                lower: false,
                same: false
            }
        };

        if (b && !d) return {
            member1: {
                higher: true,
                lower: false,
                same: false
            },
            member2: {
                higher: false,
                lower: true,
                same: false
            }
        };

        if (!b && !d) return {
            member1: {
                higher: false,
                lower: false,
                same: true
            },
            member2: {
                higher: false,
                lower: false,
                same: true
            }
        };
        return {
            member1: {
                higher: b.position > d.position,
                lower: b.position < d.position,
                same: b.position === d.position
            },
            member2: {
                higher: d.position > b.position,
                lower: d.position < b.position,
                same: d.position === b.position
            }
        };
    }),
    compareMemberWithRole: ((member: Eris.Member, role: Eris.Role): {
        higher: boolean;
        lower: boolean;
        same: boolean;
    } => {
        let a = member.roles.map(r => member.guild.roles.get(r));
        let b = a.filter(r => r.position === Math.max.apply(Math, a.map(p => p.position)))[0];

        return {
            higher: b.position < role.position,
            lower: b.position > role.position,
            same: b.position === role.position
        };
    })
};