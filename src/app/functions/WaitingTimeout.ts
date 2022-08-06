const WaitingTimeout = (timeout?: number) => {
  return new Promise((resolve: Function) => {
    setTimeout(() => {
      resolve();
    }, timeout || 10000);
  })
}

export default WaitingTimeout;