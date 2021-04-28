import { Lex } from "jvar";
import { CommandHandler } from "./handleCommand";

export class Handler {
  static invoke(..._: any[]) {
    throw new Error("not implemented");
  }
}

export class InbuiltCommand<T extends object = Record<string, Function>> {
  constructor() {}
  flags: T;
  flagAliases: Record<string, keyof T>;
  usage?: string;
  args: string[];
  context: typeof CommandHandler;
  parsedFlags: Record<string, any>;
  prepare(handler = CommandHandler, args: string[]) {
    const lexer = new Lex(this.flags, this.flagAliases);
    const result = lexer.lex(args.join(" "));
    this.args = result.args;
    this.parsedFlags = result.flags;
    this.context = handler;
    return this;
  }
  invoke() {
    return {
      out: `${this.constructor.name.replace(/^[A-Z]/g, (v) =>
        v.toLowerCase()
      )}: not implemented`,
      code: 1,
    };
  }
}
