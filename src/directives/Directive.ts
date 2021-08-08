import { Colony } from "colonies/Colony";
import { log } from "console/log";
import { randomHex } from "utils/utils";

// wrapper for a flag representing a task
export abstract class Directive {
  public static directiveName: string;
  public static color: ColorConstant;
  public static secondaryColor: ColorConstant;

  public name: string; // name of the flag
  public memory: FlagMemory; // flag memory
  public colony: Colony | undefined;

  public constructor(flag: Flag) {
    this.name = flag.name;
    this.memory = flag.memory;
    const colony = this.getColony();

    if (!colony) {
      flag.remove();
      return;
    }
    this.colony = colony;

    // register directive
    this.colony.flags.push(flag);
    Ai.overseer.registerDirective(this);
    Ai.directives[this.name] = this;
  }

  public get flag(): Flag {
    return Game.flags[this.name];
  }

  private getColony(): Colony | undefined {
    // If something is written to flag.colony, use that as the colony
    if (this.memory[_MEM.COLONY]) {
      return Ai.colonies[this.memory[_MEM.COLONY]!];
    } else {
      // If flag contains a colony name as a substring, assign to that colony, regardless of RCL
      const colonyNames = _.keys(Ai.colonies);
      for (const name of colonyNames) {
        if (this.name.includes(name)) {
          if (this.name.split(name)[1] !== "") continue; // in case of other substring, e.g. E11S12 and E11S1
          this.memory[_MEM.COLONY] = name;
          return Ai.colonies[name];
        }
      }
    }

    return undefined;
  }

  public remove() {
    delete Ai.directives[this.name];
    Ai.overseer.removeDirective(this);
    if (this.colony) {
      _.remove(this.colony.flags, flag => flag.name === this.name);
    }
    if (this.flag) {
      this.flag.remove();
    }
  }

  public static create(pos: RoomPosition): void {
    const flagName = this.directiveName + "-" + randomHex(6);
    if (Game.flags[flagName]) {
      log.error(`Flag name ${flagName} already exists`);
    }
    const result = pos.createFlag(flagName, this.color, this.secondaryColor);
    log.debug(`Flag created: ${result}`);
  }

  abstract init(): void;
  abstract run(): void;
}
