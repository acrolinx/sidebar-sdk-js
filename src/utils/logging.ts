let isEnabled = false;

export function log(message: any, ...args: any[]) {
  if (isEnabled) {
    console.log(message, ...args);
  }
}

export function enableLogging() {
  isEnabled = true;
}
