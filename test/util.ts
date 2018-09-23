
declare interface Deferred<T> {
  resolve: (value?: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
}

export function defer<T>(): Deferred<T> {
  const obj: Deferred<T> = { resolve: null, reject: null, promise: null };

  obj.promise = new Promise((resolve, reject) => {
    obj.resolve = resolve;
    obj.reject = reject;
  });

  return obj;
}
