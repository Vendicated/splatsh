import { Handler, InbuiltCommand } from "./classes";
import chalk from "chalk";
import { readdirSync } from "fs";
import { shellFlags } from ".";
import { spawn, execSync } from "child_process";
export class CommandHandler extends Handler {
  static async prepare() {
    for (let file of readdirSync(__dirname + "/commands")) {
      const data = await import(__dirname + "/commands/" + file);
      file = file.replace(/\.js$/, "");
      if (shellFlags.flags.debug)
        process.stdout.write(chalk`Loaded inbuilt command {bold ${file}}\n`);
      this.inbuiltCommands[file] = data.default;
    }
  }
  static invoke(data: string) {
    const rawArgs = data.split(/\s+/),
      args = rawArgs.slice(1),
      commandName = rawArgs[0];
    if (CommandHandler.isSyntaxError(data))
      return { out: "syntax error: unexpected end of input\n", code: 127 };
    if (commandName in CommandHandler.inbuiltCommands)
      return new CommandHandler.inbuiltCommands[commandName]()
        .prepare(this, args)
        .invoke();
    try {
      execSync("which " + commandName);
    } catch {
      return { out: `${commandName}: command not found\n`, code: 127 };
    }
    return new Promise<{ out: ""; code: NodeJS.Signals | number }>((r) => {
      const child = spawn(commandName + " " + args.join(" "), { shell: true });
      child.stdout.on("data", (d) => process.stdout.write(d.toString()));
      child.on("exit", (code, signal) => r({ out: "", code: code || signal }));
    });
  }
  static isSyntaxError(str: string) {
    return /(^&$|^function\s*$|^fn\s*$)/.test(str);
  }
  static inbuiltCommands: Record<string, typeof InbuiltCommand> = {};
}
