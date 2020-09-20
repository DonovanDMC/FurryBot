import Eris from "eris";

Object.defineProperty(Eris.User.prototype, "tag", {
	get(this: Eris.User) { return `${this.username}#${this.discriminator}`; }
});

Object.defineProperty(Eris.Member.prototype, "tag", {
	get(this: Eris.Member) { return `${this.username}#${this.discriminator}`; }
});

Object.defineProperty(Eris.Guild.prototype, "me", {
	get(this: Eris.Guild) { return this.members.get(this._client.user.id); }
});
