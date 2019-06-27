import * as Eris from "eris";
import FurryBot from "@FurryBot";
import PartialMessage from "@modules/PartialMessage";

class ClientEvent {
    event: string;
    listener: Function;
    constructor(
        event: "ready" | "disconnect",
        listener: (this: FurryBot) => void
    );
    constructor(
        event: "callCreate" | "callRing" | "callDelete",
        listener: (this: FurryBot, call: Eris.Call) => void
    );
    constructor(
        event: "callUpdate",
        listener: (this: FurryBot, call: Eris.Call, oldCall: Eris.OldCall) => void
    );
    constructor(
        event: "channelCreate" | "channelDelete",
        listener: (this: FurryBot, channel: Eris.AnyChannel) => void
    );
    constructor(
        event: "channelPinUpdate",
        listener: (this: FurryBot, channel: Eris.TextableChannel, timestamp: number, oldTimestamp: number) => void
    );
    constructor(
        event: "channelRecipientAdd" | "channelRecipientRemove",
        listener: (this: FurryBot, channel: Eris.GroupChannel, user: Eris.User) => void
    );
    constructor(
        event: "channelUpdate",
        listener: (this: FurryBot, channel: Eris.AnyChannel, oldChannel: Eris.OldChannel) => void
    );
    constructor(
        event: "friendSuggestionCreate",
        listener: (this: FurryBot, user: Eris.User, reasons: Eris.FriendSuggestionReasons) => void
    );
    constructor(
        event: "friendSuggestionDelete",
        listener: (this: FurryBot, user: Eris.User) => void
    );
    constructor(
        event: "guildAvailable" | "guildBanAdd" | "guildBanRemove",
        listener: (this: FurryBot, guild: Eris.Guild, user: Eris.User) => void
    );
    constructor(
        event: "guildDelete" | "guildUnavailable" | "guildCreate",
        listener: (this: FurryBot, guild: Eris.Guild) => void
    );
    constructor(
        event: "guildEmojisUpdate",
        listener: (this: FurryBot, guild: Eris.Guild, emojis: Eris.Emoji[]) => void
    );
    constructor(
        event: "guildMemberAdd",
        listener: (this: FurryBot, guild: Eris.Guild, member: Eris.Member) => void
    );
    constructor(
        event: "guildMemberChunk",
        listener: (this: FurryBot, guild: Eris.Guild, member: Eris.Member) => void
    );
    constructor(
        event: "guildMemberRemove",
        listener: (this: FurryBot, guild: Eris.Guild, member: Eris.Member | Eris.MemberPartial) => void
    );
    constructor(
        event: "guildMemberUpdate",
        listener: (this: FurryBot, guild: Eris.Guild, member: Eris.Member, oldMember: { roles: string[], nick?: string }) => void
    );
    constructor(
        event: "guildRoleCreate" | "guildRoleDelete",
        listener: (this: FurryBot, guild: Eris.Guild, role: Eris.Role) => void
    );
    constructor(
        event: "guildRoleUpdate",
        listener: (this: FurryBot, guild: Eris.Guild, role: Eris.Role, oldRole: Eris.RoleOptions) => void
    );
    constructor(
        event: "guildUpdate",
        listener: (this: FurryBot, guild: Eris.Guild, oldGuild: Eris.GuildOptions) => void
    );
    constructor(
        event: "hello",
        listener: (this: FurryBot, trace: string[], id: number) => void
    );
    constructor(
        event: "messageCreate",
        listener: (this: FurryBot, message: Eris.Message) => void
    );
    constructor(
        event: "messageDelete" | "messageReactionRemoveAll",
        listener: (this: FurryBot, message: Eris.Message) => void
    );
    constructor(
        event: "messageDeleteBulk",
        listener: (this: FurryBot, messages: Eris.PossiblyUncachedMessage[]) => void
    );
    constructor(
        event: "messageReactionAdd" | "messageReactionRemove",
        listener: (this: FurryBot, message: Eris.PossiblyUncachedMessage[], emoji: Eris.Emoji, userID: string) => void
    );
    constructor(
        event: "messageUpdate",
        listener: (this: FurryBot, message: Eris.Message, oldMessage?: PartialMessage) => void
    );
    constructor(
        event: "presenceUpdate",
        listener: (this: FurryBot, other: Eris.Member | Eris.Relationship, oldPresence?: Eris.OldPresence) => void
    );
    constructor(
        event: "rawWS" | "unknown",
        listener: (this: FurryBot, packet: Eris.RawPacket, id: number) => void
    );
    constructor(
        event: "relationshipAdd" | "relationshipRemove",
        listener: (this: FurryBot, relationship: Eris.Relationship) => void
    );
    constructor(
        event: "relationshipUpdate",
        listener: (this: FurryBot, relationship: Eris.Relationship, oldRelationship: { type: number }) => void
    );
    constructor(
        event: "shardPreReady" | "connect",
        listener: (this: FurryBot, id: number) => void
    );
    constructor(
        event: "typingStart",
        listener: (this: FurryBot, channel: Eris.TextableChannel, user: Eris.User) => void
    );
    constructor(
        event: "unavailableGuildCreate",
        listener: (this: FurryBot, guild: Eris.UnavailableGuild) => void
    );
    constructor(
        event: "userUpdate",
        listener: (this: FurryBot, user: Eris.User, oldUser: { username: string, discriminator: string, avatar?: string }) => void
    );
    constructor(
        event: "voiceChannelJoin",
        listener: (this: FurryBot, member: Eris.Member, newChannel: Eris.VoiceChannel) => void
    );
    constructor(
        event: "voiceChannelLeave",
        listener: (this: FurryBot, member: Eris.Member, oldChannel: Eris.VoiceChannel) => void
    );
    constructor(
        event: "voiceChannelSwitch",
        listener: (this: FurryBot, member: Eris.Member, newChannel: Eris.VoiceChannel, oldChannel: Eris.VoiceChannel) => void
    );
    constructor(
        event: "voiceStateUpdate",
        listener: (this: FurryBot, member: Eris.Member, oldState: Eris.OldVoiceState) => void
    );
    constructor(
        event: "warn" | "debug" | "error",
        listener: (this: FurryBot, message: string, id: number) => void
    );

    constructor(event: string, listener: Function) {
        this.event = event;
        this.listener = listener;
    }
}

export default ClientEvent;