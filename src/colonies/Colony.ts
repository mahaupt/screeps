
// colony wraps all objects
// run road network
// run logistics
// run room planner
export class Colony {
  name: string; // name of room
  room: Room; // the room object
  flags: Flag[];

  constructor(name: string) {
    this.name = name;
    this.room = Game.rooms[name];

    this.flags = [];
  }
}
