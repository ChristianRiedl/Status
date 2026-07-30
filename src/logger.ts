import type { ILogger, ILoggerEntry,  } from "@christianriedl/utils"; 
import { LogLevel } from "@christianriedl/utils"; 

export class Logger implements ILogger {
    name: string;
    countAll: number;
    countEnabled: number;
    minLogLevel: LogLevel;

    constructor(name: string, minLogLevel: LogLevel) {
      this.name = name;
      this.minLogLevel = minLogLevel;
      this.countAll = this.countEnabled = 0;
    }
    trace(msg: string): void {
        this.log(LogLevel.Trace, msg);
    }
    info(msg: string): void {
      this.log(LogLevel.Information, msg);
    }
    warning(msg: string): void {
      this.log(LogLevel.Warning, msg);
    }
    error(msg: string): void {
      this.log(LogLevel.Error, msg);
    }
    log(severity: LogLevel, msg: string): void {
      this.countAll++;
      if (severity >= this.minLogLevel) {
        this.countEnabled++;
        switch (severity) {
          case LogLevel.Trace:
            console.trace(`TRACE: ${msg}`);
            break;
          case LogLevel.Information:
            console.info(`INFO : ${msg}`);
            break;
          case LogLevel.Warning:
            console.warn(`WARN : ${msg}`);
            break;
          case LogLevel.Error:
            console.error(`ERROR: ${msg}`);
            break;
        }
      }
    }
    logEntry(logEntry: ILoggerEntry): void {
      this.log(logEntry.logLevel, logEntry.message);
    }
    startPerformance(): void {
    }
    performance(msg: string): void {
    }

}
