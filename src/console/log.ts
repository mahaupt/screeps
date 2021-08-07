export enum LogLevels {
  ERROR, // log.level = 0
  WARNING, // log.level = 1
  ALERT, // log.level = 2
  INFO, // log.level = 3
  DEBUG // log.level = 4
}

/**
 * Default debug level for log output
 */
export const LOG_LEVEL: number = LogLevels.DEBUG;

/**
 * Prepend log output with current tick number.
 */
export const LOG_PRINT_TICK = true;

export function logcolor(str: string, color: string): string {
  return `<font color='${color}'>${str}</font>`;
}

function time(): string {
  return logcolor(Game.time.toString(), "gray");
}

class Log {
  public constructor() {
    _.defaultsDeep(Memory, {
      settings: {
        log: {
          level: LOG_LEVEL,
          showTick: LOG_PRINT_TICK
        }
      }
    });
  }

  public get level(): number {
    return Memory.settings.log.level;
  }

  public get showTick(): boolean {
    return Memory.settings.log.showTick;
  }

  public error(...args: any[]): undefined {
    if (this.level >= LogLevels.ERROR) {
      console.log(this.buildArguments(LogLevels.ERROR).concat(args));
    }
    return undefined;
  }

  public warning(...args: any[]): undefined {
    if (this.level >= LogLevels.WARNING) {
      console.log(this.buildArguments(LogLevels.WARNING).concat(args));
    }
    return undefined;
  }

  public alert(...args: any[]): undefined {
    if (this.level >= LogLevels.ALERT) {
      console.log(this.buildArguments(LogLevels.ALERT).concat(args));
    }
    return undefined;
  }

  public info(...args: any[]): undefined {
    if (this.level >= LogLevels.INFO) {
      console.log(this.buildArguments(LogLevels.INFO).concat(args));
    }
    return undefined;
  }

  public debug(...args: any[]) {
    if (this.level >= LogLevels.DEBUG) {
      console.log(this.buildArguments(LogLevels.DEBUG).concat(args));
    }
  }

  private buildArguments(level: number): string[] {
    const out: string[] = [];
    switch (level) {
      case LogLevels.ERROR:
        out.push(logcolor("ERROR  ", "red"));
        break;
      case LogLevels.WARNING:
        out.push(logcolor("WARNING", "orange"));
        break;
      case LogLevels.ALERT:
        out.push(logcolor("ALERT  ", "yellow"));
        break;
      case LogLevels.INFO:
        out.push(logcolor("INFO   ", "green"));
        break;
      case LogLevels.DEBUG:
        out.push(logcolor("DEBUG  ", "gray"));
        break;
      default:
        break;
    }
    if (this.showTick) {
      out.push(time());
    }
    return out;
  }
}

export const log = new Log();
