module.exports = {
	triggers: [
		"hug"
	],
	userPermissions: [],
	botPermissions: [],
	cooldown: 2e3,
	description: "Hug someone!",
	usage: "<@user or text>",
	nsfw: false,
	devOnly: false,
	betaOnly: false,
	guildOwnerOnly: false,
	run: (async (self,local) => {
		if(local.args.length < 1) return new Error("ERR_INVALID_USAGE");
		
		var input = local.args.join(" ");
		var text = self.varParse(local.c,{author:local.author,input:input});
		if(local.gConfig.commandImages) {
			if(!local.channel.permissionsFor(local.guild.me).has("ATTACH_FILES")) return local.message.reply("Hey, I require the `ATTACH_FILES` permission for images to work on these commands!");
			var img = await self.imageAPIRequest(true,"hug");
			if(!img.success) return local.message.reply(`Image API returned an error: ${img.error.description}`);
			var attachment = new self.Discord.MessageAttachment(img.response.image);
			local.channel.send(text,attachment);
		} else {
			local.channel.send(text);
		}
		
		if(!local.gConfig.deleteCommands) {
			local.message.delete().catch(noerr => {});
		}
	})
};