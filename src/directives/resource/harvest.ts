import { Directive } from "directives/Directive";

export class DirectiveHarvest extends Directive {
  public static directiveName = "harvest";
  public static color = COLOR_YELLOW;
  public static secondaryColor = COLOR_YELLOW;

  public constructor(flag: Flag) {
    super(flag);
  }

  public init(): void {
    throw new Error("Method not implemented.");
  }
  public run(): void {
    throw new Error("Method not implemented.");
  }
}
