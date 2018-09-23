export function wait(timeout: number, ...args: any[]) {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout, ...args);
  });
}
