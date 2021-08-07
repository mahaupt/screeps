export enum LogLevels {
	ERROR,		// log.level = 0
	WARNING,	// log.level = 1
	ALERT,		// log.level = 2
	INFO,		// log.level = 3
	DEBUG		// log.level = 4
}

/**
 * Default debug level for log output
 */
export const LOG_LEVEL: number = LogLevels.DEBUG;

/**
 * Prepend log output with current tick number.
 */
export const LOG_PRINT_TICK: boolean = true;

export function color(str: string, color: string): string {
	return `<font color='${color}'>${str}</font>`;
}

function time(): string {
	return color(Game.time.toString(), 'gray');
}

class Log {


  constructor() {
    _.defaultsDeep(Memory, {
			settings: {
				log: {
					level     : LOG_LEVEL,
					showTick  : LOG_PRINT_TICK,
				}
			}
		});
  }

  get level(): number {
		return Memory.settings.log.level;
	}

  get showTick(): boolean {
    return Memory.settings.log.showTick;
  }

  error(...args: any[]): undefined {
		if (this.level >= LogLevels.ERROR) {
			console.log(this.buildArguments(LogLevels.ERROR).concat(args));
		}
		return undefined;
	}

	warning(...args: any[]): undefined {
		if (this.level >= LogLevels.WARNING) {
			console.log(this.buildArguments(LogLevels.WARNING).concat(args));
		}
		return undefined;
	}

	alert(...args: any[]): undefined {
		if (this.level >= LogLevels.ALERT) {
			console.log(this.buildArguments(LogLevels.ALERT).concat(args));
		}
		return undefined;
	}

	info(...args: any[]): undefined {
		if (this.level >= LogLevels.INFO) {
			console.log(this.buildArguments(LogLevels.INFO).concat(args));
		}
		return undefined;
	}

	debug(...args: any[]) {
		if (this.level >= LogLevels.DEBUG) {
			console.log(this.buildArguments(LogLevels.DEBUG).concat(args));
		}
	}

  private buildArguments(level: number): string[] {
		const out: string[] = [];
		switch (level) {
			case LogLevels.ERROR:
				out.push(color('ERROR  ', 'red'));
				break;
			case LogLevels.WARNING:
				out.push(color('WARNING', 'orange'));
				break;
			case LogLevels.ALERT:
				out.push(color('ALERT  ', 'yellow'));
				break;
			case LogLevels.INFO:
				out.push(color('INFO   ', 'green'));
				break;
			case LogLevels.DEBUG:
				out.push(color('DEBUG  ', 'gray'));
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
