module.exports = (async(client)=>{
    const blapi = require("blapi");
    blapi.manualPost(client.guilds.size,client.user.id,client.config.botLists);
    // botblock was blocked on discordbots.org
    const rq = await client.request(`https://discordbots.org/api/bots/${client.user.id}/stats`,{
        method: "POST",
        body: JSON.stringify({
            server_count: client.guilds.size,
            shard_count: client.options.shardCount
        }),
        headers: {
            "Content-Type": "application/json",
            Authorization: client.config.botLists['discordbots.org']
        }
    })
    .then(req=>JSON.parse(req.body));
    client.logger.log(`Posted guild counts: ${client.guilds.size}`);
    return {count:client.guilds.size};
})