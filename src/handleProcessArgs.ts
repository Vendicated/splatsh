/**
 * @fileoverview !!!!!! DO NOT USE THIS FOR BUILTIN COMMANDS !!!!!!
 *   This is for the main process, not any builtin commands
 */

import chalk from "chalk";
import { ExitCodes } from "./constants";
import { CommandHandler } from "./handleCommand";
import { printf, printfErr, parseArgs } from "./util";
import { readFileSync } from "fs";

export const VALID_FLAGS = {
  h: "help",
  help: Boolean,
  c: Boolean,
  exec: String
};

type keyofValidFlags = keyof typeof VALID_FLAGS;

function parseProcessFlags(str: string) {
  const flagRegExp = new RegExp(
    `(?:(?:-(${Object.keys(VALID_FLAGS)
      .filter(k => k.length === 1 && VALID_FLAGS[k as keyofValidFlags] !== String)
      .join("|")})|--(${Object.keys(VALID_FLAGS)
      .filter(
        v => typeof VALID_FLAGS[v as keyofValidFlags] !== "string" && VALID_FLAGS[v as keyofValidFlags] !== String
      )
      .join("|")})|-{1,2}${Object.keys(VALID_FLAGS).filter(
      k => VALID_FLAGS[k as keyofValidFlags] === String
    )}\\b(?:[ :=]+(".*?"|\\S+))?))`,
    "gim"
  );
  const matchResult = str.match(flagRegExp)?.map(v => v.replace(/^-{1,2}/, ""));
  // @ts-ignore
  const result: Record<keyof typeof VALID_FLAGS, string | boolean> = {};
  if (!matchResult) return result;
  for (let x of matchResult) {
    const splitted = x.split(" ");
    const name = splitted.shift();
    x = splitted.join(" ");
    if (x.endsWith('"') && x.startsWith('"') && x.length >= 2) x = x.replace(/(^"|"$)/g, "");
    result[name as keyofValidFlags] = x || true;
  }
  return result;
}

export async function handleArgs(args: typeof process.argv) {
  const str = args.join(" ");
  if (!str) return;
  const flags = parseProcessFlags(str);
  if (flags.c) {
    await CommandHandler.invoke(parseArgs(str.slice(str.indexOf("-c") + 2)), {}).then(v => {
      if (v.code !== ExitCodes.SUCCESS) {
        printfErr(v.out);
        process.exit(v.code as ExitCodes);
      } else printf(v.out);
      process.exit();
    });
  } else if (flags.h || flags.help) {
    printf(chalk`{greenBright {bold Splatsh}}
The {green Node.js}-based shell for everyone!

---------
{bold Usage}: splatsh [FILE] [-h] [--help] [-c ARGS...]

---------
{bold FLAGS}:
  -h, --help\t\tShows this screen
  -c\t\t\tExecutes arbitary Splatsh code
`);
    process.exit(0);
  } else {
    const cmd = args.shift();
    const res = await CommandHandler.invoke([cmd, ...args], {});
    if (res.code !== ExitCodes.SUCCESS) printfErr(res.out);
    else printf(res.out);
    process.exit(res.code as ExitCodes);
  }
}

export async function handleStdin(stdin: typeof process.stdin) {
  if (stdin.isTTY) return;
  try {
    const data = readFileSync(0, "utf-8").split("(\n|&&|\\|\\|)");
    if (!data) return;
    let stdout = "",
      // TODO: support stderr differently than stdout
      // stderr = "",
      code = 0;
    for (let ind = 0; ind < data.length; ind++) {
      const cmd = data[ind];
      const res = await CommandHandler.invoke(parseArgs(cmd), {});
      code = res.code as ExitCodes;
      stdout += res.out;
      if (res.code !== ExitCodes.SUCCESS) {
        printfErr(stdout);
        process.exit(code);
      } else if (data.lastIndexOf(cmd) === ind) {
        printf(stdout);
        process.exit(code);
      }
    }
  } catch {
    comment: {
      break comment;
    }
  }
}

export default handleStdin(process.stdin).then(() => {
  return handleArgs(process.argv.slice(2) || []);
});
