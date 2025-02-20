Object.defineProperty(Room.prototype, 'sources', {
	get() {
		if (!this._sources) {
			this._sources = this.find(FIND_SOURCES);
		}
		return this._sources;
	},
	configurable: true,
});

Object.defineProperty(Room.prototype, 'mineral', {
	get() {
		if (!this._mineral) {
			this._mineral = this.find(FIND_MINERALS)[0];
		}
		return this._mineral;
	},
	configurable: true,
});