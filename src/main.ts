'use strict';

import { IAi } from "./Ai";
import { ErrorMapper } from "utils/ErrorMapper";
import { Mem } from "./memory/Memory";

function main(): void {
  Mem.load();

  if (!Ai) {
    global.Ai = new IAi();
  }
  Ai.run();
  Mem.clean();
}

export const loop = ErrorMapper.wrapLoop(main);
