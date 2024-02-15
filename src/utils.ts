type NormalizePort = (val: number | string) => number | string | boolean;

export const normalizePort: NormalizePort = (val) => {
  let port: number = typeof val === 'string' ? parseInt(val, 10) : val;

  if (isNaN(port)) return val;
  else if (port >= 0) return port;
  else return false;
};

export const shuffle = <T>(array: T[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
