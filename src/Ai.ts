import { Colony } from "colonies/Colony";
import { Directive } from "directives/Directive";
import { log } from "console/log";
import { Overseer } from "Overseer";
import { Operator } from "operators/Operator";

export class IAi {
  public colonies: { [roomName: string]: Colony };
  public directives: { [flagName: string]: Directive };
  public operators: Operator[];
  public overseer: Overseer;

  public constructor() {
    log.debug("creating AI class");

    this.colonies = {};
    this.directives = {};
    this.operators = [];

    for (const roomName in Game.rooms) {
      this.colonies[roomName] = new Colony(roomName);
    }

    this.overseer = new Overseer();
  }

  public run(): void {
    this.overseer.run();
  }
}
