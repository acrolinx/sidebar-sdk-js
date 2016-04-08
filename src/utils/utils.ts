namespace acrolinx.plugins.utils {

  import _ = acrolinxLibs._;

  export function logTime(text: string, f: Function) {
    const startTime = Date.now();
    const result = f();
    console.log(`Duration of "${text}:"`, Date.now() - startTime);
    return result;
  }

}