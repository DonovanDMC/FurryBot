module.exports = (async(client) => {
    client.logger = new client.FurryBotLogger(client);
    client.logger.log(`Bot has started with ${client.users.size} users in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    const rotatingStatus = (async()=>{
		client.user.setActivity(`🐾 Debugging! 🐾`,{type: "PLAYING"}).then(()=>{
            setTimeout(()=>{
                client.user.setActivity(`🐾 ${client.config.defaultPrefix}help for help! 🐾`,{type: "PLAYING"}).then(()=>{
                    setTimeout(()=>{
                        client.user.setActivity(`🐾 ${client.config.defaultPrefix}help in ${client.guilds.size} guilds! 🐾`,{type: "PLAYING"}).then(()=>{
                            setTimeout(()=>{
                                client.user.setActivity(`🐾 ${client.config.defaultPrefix}help with ${client.users.size} users! 🐾`,{type: "WATCHING"}).then(()=>{
                                    setTimeout(()=>{
                                        client.user.setActivity(`🐾 ${client.config.defaultPrefix}help in ${client.channels.size} channels! 🐾`,{type: "LISTENING"}).then(()=>{
                                            setTimeout(()=>{
                                                client.user.setActivity(`🐾 ${client.config.defaultPrefix}help with ${client.options.shardCount} shard${client.options.shardCount>1?"s":""}! 🐾`,{type: "PLAYING"});
                                            },15e3);
                                        });
                                    },15e3);
                                });
                            },15e3);
                        });
                    },15e3);
                });
            },15e3);
        });
    });

    rotatingStatus();
    setInterval(rotatingStatus,75e3)
   client.logger.log(`ready with ${client.options.shardCount} shard${client.options.shardCount>1?"s":""}!`);

     client.setInterval(()=>{
        client.voiceConnections.forEach((vc)=>{
            if(vc.channel.members.filter(m=>m.id!==client.user.id).size === 0) {
                vc.channel.leave();
                client.logger.log(`Left voice channel ${vc.channel.name} (${vc.channel.id}) due to inactivity.`);
            }
        });
   },3e4);
   
   client.db = new client.FurryBotDatabase(client);
   
    await client.dbStats(client);
    // post general stats to db every 60 seconds
    client.setInterval(client.dbStats,6e4,client);
    
    /*var webhookData = {
        title: `Shard #${client.shard.id} is ready`,
        timestamp: client.getCurrentTimestamp()
    }*/
    
    //var webhookEmbed = new client.Discord.MessageEmbed(webhookData);
    
    //client.webhooks.shards.send(webhookEmbed);
    client.srv = client.server.load(client);
    if(!client.config.beta) {
        //const ls = client.listStats(client);
        setInterval(client.listStats,3e5,client);
    }

	setInterval(async()=>{
		if(["00:00:00"].includes(client.getDateTime())) {
			var date = new Date(),
			d = `${date.getMonth()+1}-${date.getDate()-1}-${date.getFullYear()}`,
			count = (await client.db.getStats("dailyjoins"))[d]||0;
			var data = {
				author: {
					name: "Donovan_DMC#1337",
					"icon_url": "https://i.donovand.info/Don.gif"
				},
				title: `Total Guilds Joined ${d}\t Current Total: ${client.guilds.size}`,
				description: `Total Guilds Joined Today: **${count}**`,
				footer: {
					text: `Shard ${client.guilds.get(client.config.bot.mainGuild).shard.id}/${client.options.shardCount} | Bot Version ${client.config.bot.version}`
				},
				color: client.randomColor(),
				timestamp: client.getCurrentTimestamp(),
				thumbnail: {
					url: "https://i.furry.bot/furry-small.png"
				}
			}
			var embed = new client.Discord.MessageEmbed(data);
			client.channels.get(client.config.bot.channels.daily).send(embed).then(n=>{
				client.logger.log(`Posted daily stats, ${d}: ${count}, total: ${client.guilds.size}`);
			}).catch(client.logger.error);
		}
    },1e3);
    console.log("end of ready");
});