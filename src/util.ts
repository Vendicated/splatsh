export function printf(str: string, ...args: any[]) {
  if (str.includes("%s")) {
    let ind = 0;
    while (str.includes("%s")) {
      str.replace(/%s/, args[ind]);

      ind++;
    }
  }
  console.log(str);
  process.stdout.write(str);
}

export function prompt(hook: Function, context = "") {
  hook(context + "$> ");
}
