import Category from "../../modules/CommandHandler/Category";
import Command from "../../modules/CommandHandler/Command";
import * as fs from "fs-extra";
const ext = __filename.split(".").reverse()[0];

const cmd: Command[] = fs.readdirSync(`${__dirname}`).filter(f => f.endsWith(ext) && f !== `index.${ext}` && !fs.lstatSync(`${__dirname}/${f}`).isDirectory()).map(f => require(`${__dirname}/${f}`).default);

const cat = new Category({
	name: "music",
	file: __filename,
	restrictions: [
		"developer"
	]
});

cmd.map(c => cat.addCommand(c.setCategory(cat.name)));

export default cat;