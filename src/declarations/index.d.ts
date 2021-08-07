declare var global: any;

declare namespace NodeJS {
	interface Global {
    Ai: IAi;
  }
}

interface IAi {
  overseer: any;
  colonies: any;
  directives: any;
  run(): void;
}

declare var Ai: IAi;
