// add: this.mdb.collection("guilds").findOneAndUpdate({id: message.channel.guild.id}, {$push: {selfAssignableRoles: "role"}});
// remove: this.mdb.collection("guilds").findOneAndUpdate({id: message.channel.guild.id},{$pull: {selfAssignableRoles: "role"}})
// get: this.mdb.collection("guilds").findOne({id: message.channel.guild.id}).then(res => res.selfAssignableRoles);

module.exports = {
	triggers: [
		"deletechannel",
		"rmch",
		"dc"
	],
	userPermissions: [
		"manageChannels" // 16
	],
	botPermissions: [
		"manageChannels" // 16
	],
	cooldown: 1e3,
	description: "Delete a channel",
	usage: "<name>",
	nsfw: false,
	devOnly: false,
	betaOnly: false,
	guildOwnerOnly: false,
	run: (async function(message) {
		if(message.args.length === 0) return new Error("ERR_INVALID_USAGE");
		const channel = message.getChannelFromArgs(0,false,true);
		if(!channel) return message.errorEmbed("INVALID_ROLE");
		await channel.delete(`Command: ${message.author.username}#${message.author.discriminator} (${message.author.id})`).then(() => {
			return message.channel.createMessage(`<@!${message.author.id}>, deleted role **${channel.name}**`);
		});
	})
};