// add: message.client.r.table("guilds").get(message.guild.id).update({selfAssignableRoles: message.client.r.row("selfAssignableRoles").append("role")})
// remove: message.client.r.table("guilds").get(message.guild.id).update({selfAssignableRoles: message.client.r.row("selfAssignableRoles").difference(["role"])})
// get: message.client.r.table("guilds").get(message.guild.id)("selfAssignableRoles")

module.exports = {
	triggers: [
		"asar",
		"addselfassignablerole"
	],
	userPermissions: [
		"MANAGE_ROLES"
	],
	botPermissions: [
		"MANAGE_ROLES"
	],
	cooldown: 1e3,
	description: "Add a self assignable role",
	usage: "<@role/role id/role name>",
	nsfw: false,
	devOnly: false,
	betaOnly: false,
	guildOwnerOnly: false,
	run: (async(message) => {
		if(message.args.length === 0) return new Error("ERR_INVALID_USAGE");
		let role, roles;
		role = await message.getRoleFromArgs();
		if(!role) return message.errorEmbed("INVALID_ROLE");
		if(message.member.roles.highest.rawPosition <= role.rawPosition && message.guild.owner.id !== message.member.id) return message.reply("You cannot add roles as high as, or higher than you.");
		if(message.guild.me.roles.highest.rawPosition <= role.rawPosition) return message.reply("this role is higher than, or as high as me, I cannot remove or assign it.");
		if(role.managed) return message.reply("this role is managed (likely permissions for a bot), these cannot be removed or assigned.");
		roles = await message.client.r.table("guilds").get(message.guild.id)("selfAssignableRoles");
		if(roles.includes(role.id)) return message.reply("this role is already listed as a self assignable role.");
		await message.client.r.table("guilds").get(message.guild.id).update({selfAssignableRoles: message.client.r.row("selfAssignableRoles").append(role.id)});
		return message.reply(`Added **${role.name}** to the list of self assignable roles.`);
	})
};