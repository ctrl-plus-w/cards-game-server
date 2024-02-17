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

export const values = <TVal>(obj: Record<string, TVal>) => Object.values(obj) as TVal[];

export const countElements = <T extends string | number | symbol>(arr: T[]) => {
  return arr.reduce(
    (counts, value) => {
      if (value in counts) counts[value]++;
      else counts[value] = 1;

      return counts;
    },
    {} as Record<T, number>,
  );
};
