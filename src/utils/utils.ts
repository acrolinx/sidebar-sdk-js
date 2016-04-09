namespace acrolinx.plugins.utils {
  export function logTime(text: string, f: Function) {
    const startTime = Date.now();
    const result = f();
    console.log(`Duration of "${text}:"`, Date.now() - startTime);
    return result;
  }
}