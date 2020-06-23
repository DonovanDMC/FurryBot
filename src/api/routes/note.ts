import { Route } from "..";
import config from "../../config";
import * as fs from "fs";

export default class NoteRoute extends Route {
	constructor() {
		super("/note");
	}

	setup() {
		super.setup();
		const app = this.app;
		const client = this.client;

		app
			.get("/", async (req, res) => res.status(400).end("Missing Note Name."))
			.get("/:name", async (req, res) => {
				if (!fs.existsSync(`${config.dir.base}/src/assets/notes/${req.params.name}.txt`)) return res.status(404).end("Report not found.");
				const report = fs.readFileSync(`${config.dir.base}/src/assets/notes/${req.params.name}.txt`).toString();
				return res.status(200).end(report);
			});
	}
}
