import { CommandHandler } from "./handleCommand";
import { CommandResult, PotentialPromise } from "./types";
import { resolveVariable } from "./util";

export class Handler {
  public static invoke(..._args: any[]): PotentialPromise<void> {
    throw new Error("Not implemented");
  }
}

/* TODO: what should these types be? */
export abstract class InbuiltCommand<
  Flags extends Record<string, unknown> = Record<string, (...args: unknown[]) => unknown>
> {
  public abstract readonly usage: string;
  public flags: Flags;
  public variables: Record<string, string>;
  public flagAliases: Record<string, keyof Flags>;
  public args: string[];
  public context: typeof CommandHandler;
  public parsedFlags: Record<string, any>;

  public getVariable(key: string) {
    return Object.prototype.hasOwnProperty.call(this.variables, key) ? this.variables[key] : resolveVariable(key);
  }

  public prepare(handler = CommandHandler, args: string[], variables: Record<string, string>) {
    this.args = args;
    this.context = handler;
    this.variables = variables;
    return this;
  }

  abstract invoke(): PotentialPromise<CommandResult>;
}
