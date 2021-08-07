import { Colony } from "colonies/Colony";

// wrapper for a flag representing a task
export abstract class Directive {
  name: string;     // name of the flag
  memory: any;      // flag memory
  colony: Colony;

  constructor(flag: Flag) {

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

  private getColony(): Colony | undefined {
    // If something is written to flag.colony, use that as the colony
		if (this.memory[_MEM.COLONY]) {
			return Ai.colonies[this.memory[_MEM.COLONY]!];
		} else {
      return undefined;
    }
  }


	abstract init(): void;
  abstract run(): void;
}
