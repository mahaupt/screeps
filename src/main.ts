import { Mem } from "./memory/Memory";
import { ErrorMapper } from "utils/ErrorMapper";

function main(): void {
  console.log(`Current game tick is ${Game.time}`);

  Mem.clean();
}


export const loop = ErrorMapper.wrapLoop(main);
