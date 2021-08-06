import { IAi } from "Ai";

declare var global: any;

declare namespace NodeJS {
	interface Global {
    Ai: IAi;
  }
}
