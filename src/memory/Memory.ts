export class Mem {

  public static load(): void {
    if (!Memory.creeps) {
      Memory.creeps = {};
    }
    if (!Memory.flags) {
      Memory.flags = {};
    }
    if (!Memory.rooms) {
      Memory.rooms = {};
    }
    if (!Memory.colonies) {
      Memory.colonies = {};
    }
  }

  public static clean(): void {
    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
      if (!(name in Game.creeps)) {
        delete Memory.creeps[name];
      }
    }
  }
}
