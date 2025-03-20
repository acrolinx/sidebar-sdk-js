let isEnabled = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function log(message: any, ...args: any[]) {
  if (isEnabled) {
    console.log(message, ...args);
  }
}

export function enableLogging() {
  isEnabled = true;
}
