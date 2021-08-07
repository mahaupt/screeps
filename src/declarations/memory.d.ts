interface Memory {
  colonies: { [name: string]: any };
  settings: {
    log: LoggerMemory;
  };
}

// Room memory key aliases to minimize memory size

declare const enum _MEM {
  TICK = "T",
  EXPIRATION = "X",
  COLONY = "C",
  OVERLORD = "O",
  DISTANCE = "D"
}

interface FlagMemory {
  [_MEM.COLONY]?: string;
}

interface LoggerMemory {
  level: number;
  showTick: boolean;
}
