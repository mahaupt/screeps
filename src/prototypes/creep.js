Object.defineProperty(Creep.prototype, 'isAtHome', {
	get() {
		return this.memory.home == this.room.name;
	},
	configurable: true,
});

Object.defineProperty(Creep.prototype, 'home', {
	get() {
		return Game.rooms[this.memory.home];
	},
	configurable: true,
});