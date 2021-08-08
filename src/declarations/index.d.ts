declare let global: any;

declare namespace NodeJS {
  interface Global {
    Ai: IAi;
  }
}

interface IAi {
  overseer: IOverseer;
  colonies: { [roomName: string]: any };
  directives: { [flagName: string]: any };
  run(): void;
}

interface IOverseer {
  registerDirective(directive: any): void;
  removeDirective(directive: any): void;
}

declare let Ai: IAi;
