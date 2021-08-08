import { Directive } from "directives/Directive";
import { Operator } from "operators/Operator";

export class Overseer {
  public operators: Operator[];
  public directives: Directive[];

  public constructor() {
    this.operators = [];
    this.directives = [];
  }

  public run(): void {}
  public registerDirective(directive: Directive): void {}
  public removeDirective(directive: Directive): void {}
}
