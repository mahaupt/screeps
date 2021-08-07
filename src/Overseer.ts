import { Directive } from "directives/Directive";
import { Operator } from "operators/Operator";

export class Overseer {

  operators: Operator[];
  directives: Directive[];

  constructor() {
    this.operators = [];
    this.directives = [];
  }


  public run(): void {

  }
}
