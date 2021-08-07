import { Colony } from "colonies/Colony";
import { log } from "console/log";
import { Directive } from "directives/Directive";
import { Operator } from "operators/Operator";
import { Overseer } from "Overseer";

export class IAi {
  colonies: {[name: string]: Colony};
  directives: Directive[];
  operators: Operator[];
  overseer: Overseer;

  constructor() {
    log.debug("creating AI class");

    this.colonies = {};
    this.directives = [];
    this.operators = [];

    for(let roomName in Game.rooms) {
      this.colonies[roomName] = new Colony(roomName);
    }

    this.overseer = new Overseer();
  }

  public run(): void {
    this.overseer.run();
  }
}
