module.exports = {
	triggers: [
		"bunny",
		"bun",
		"bunbun"
	],
	userPermissions: [],
	botPermissions: [
		"ATTACH_FILES"
	],
	cooldown: 3e3,
	description: "Get a picture of a cute bun!",
	usage: "",
	nsfw: false,
	devOnly: false,
	betaOnly: false,
	guildOwnerOnly: false,
	run: (async (self,local) => {
		local.channel.startTyping();
		try {
			var req = await self.request("https://api.bunnies.io/v2/loop/random/?media=gif",{
			method: "GET",
			headers: {
				"User-Agent": self.config.web.userAgent
			}
		});
		var response = JSON.parse(req.body);
		var attachment = new self.Discord.MessageAttachment(response.media.gif,`${response.id}.gif`);
		}catch(e){
			console.log(e);
			var attachment = new self.Discord.MessageAttachment(self.config.images.serverError);
		}
		local.channel.send(attachment);
		return local.channel.stopTyping();
	})
};