// colony wraps all objects
// run road network
// run logistics

import { DirectiveHarvest } from "directives/resource/harvest";

// run room planner
export class Colony {
  public name: string; // name of room
  public room: Room; // the room object
  public flags: Flag[];

  public constructor(name: string) {
    this.name = name;
    this.room = Game.rooms[name];

    this.flags = [];
  }
}
