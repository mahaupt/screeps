import { Directive } from "./Directive";
import { DirectiveHarvest } from "./resource/harvest";

export function DirectiveWrapper(flag: Flag): Directive | undefined {
  switch (flag.color) {
    // Resource directives =========================================================================================
    case COLOR_YELLOW:
      switch (flag.secondaryColor) {
        case COLOR_YELLOW:
          return new DirectiveHarvest(flag);
      }
      break;
  }

  return undefined;
}
