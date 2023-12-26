async function delay(milliseconds = 0, returnValue: unknown): Promise<unknown> {
  return new Promise((done) =>
    setTimeout(() => done(returnValue), milliseconds)
  );
}

export async function isResolved(promise: Promise<any>): Promise<unknown> {
  return await Promise.race([
    delay(0, 'sahil'),
    promise.then(
      () => true,
      () => false
    ),
  ]);
}
