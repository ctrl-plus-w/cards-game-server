import Take6Card from '@/class/Take6Card';

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

export const lastEl = <T>(arr: T[]) => {
  if (arr.length) return arr[arr.length - 1];
};

export const isDefined = <T>(el: T | undefined | null): el is T => el !== undefined && el !== null;

export const calculateBeefHead = (cardOrRank: Take6Card | number) => {
  const rank = typeof cardOrRank === 'number' ? cardOrRank : cardOrRank.rank;

  if (rank % 11 === 0 && rank % 5 === 0 && rank % 10 !== 0) return 7;
  if (rank % 11 === 0) return 5;
  if (rank % 10 === 0) return 3;
  if (rank % 5 === 0) return 2;

  return 1;
};
