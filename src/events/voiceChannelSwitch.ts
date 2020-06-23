import ClientEvent from "../util/ClientEvent";
import FurryBot from "../main";
import * as Eris from "eris";
import { db } from "../modules/Database";
import { Colors } from "../util/Constants";
import config from "../config";

export default new ClientEvent("voiceChannelSwitch", (async function (this: FurryBot, member: Eris.Member, newChannel: Eris.VoiceChannel, oldChannel: Eris.VoiceChannel) {
	this.track("events", "voiceChannelSwitch");

	if (config.beta && !config.client.betaEventGuilds.includes(member.guild.id)) return;

	const g = await db.getGuild(member.guild.id);
	if (!g || !g.logEvents || !(g.logEvents instanceof Array)) return;
	const e = g.logEvents.find(l => l.type === "voiceSwitch");
	if (!e || !e.channel) return;
	if (!/^[0-9]{15,21}$/.test(e.channel)) return g.mongoEdit({ $pull: e });
	const ch = member.guild.channels.get(e.channel) as Eris.GuildTextableChannel;
	if (!ch) return g.mongoEdit({ $pull: e });

	const embed: Eris.EmbedOptions = {
		title: "Member Switched Voice Channels",
		author: {
			name: `${member.username}#${member.discriminator}`,
			icon_url: member.avatarURL
		},
		description: `Member ${member.username}#${member.discriminator} moved from the voice channel ${oldChannel.name} to ${newChannel.name}`,
		timestamp: new Date().toISOString(),
		color: Colors.orange
	};

	// const log = await Utility.fetchAuditLogEntries(member.guild, Eris.Constants.AuditLogActions.MEMBER_MOVE, null);
	// if (log.success) embed.description += `\nMoved By ${log.blame.username}#${log.blame.discriminator}\nReason: ${log.reason}`;

	return ch.createMessage({ embed }).catch(err => null);
}));
