module.exports = (async function(info) {
	this.trackEvent({
		group: "EVENTS",
		event: "client.events.debug",
		properties: {
			bot: {
				version: this.config.bot.version,
				beta: this.config.beta,
				alpha: this.config.alpha,
				server: this.os.hostname()
			}
		}
	});
	if(!this.logger) console.debug(info);
	else this.logger.debug(info);
});