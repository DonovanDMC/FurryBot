import Command from "../../util/cmd/Command";
import Internal from "../../util/Functions/Internal";

export default new Command(["fuck", "frick"], __filename)
	.setBotPermissions([
		"attachFiles",
		"embedLinks"
	])
	.setUserPermissions([])
	.setRestrictions([])
	.setCooldown(3e3, true)
	.setHasSlashVariant(false)
	.setExecutor(async function (msg, cmd) {
		return Internal.handleMemeCommand("text", msg, cmd);
	});
