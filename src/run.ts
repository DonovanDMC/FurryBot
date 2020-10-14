import config from "./config";
import ClusterManager from "./clustering/ClusterManager";
import "./util/MonkeyPatch";

const c = new ClusterManager(`${__dirname}/bot/index.${__filename.split(".").slice(-1)[0]}`, config.client.token, config.client.options);

c.launch();
