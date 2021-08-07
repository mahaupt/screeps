"use strict";

import { ErrorMapper } from "utils/ErrorMapper";
import { Mem } from "memory/Memory";
import { IAi } from "Ai";

function main(): void {
  Mem.load();
  if (Mem.pauseForCpu()) return;

  if (!global.Ai) {
    global.Ai = new IAi();
  }

  Ai.run();
  Mem.clean();
}

export const loop = ErrorMapper.wrapLoop(main);
