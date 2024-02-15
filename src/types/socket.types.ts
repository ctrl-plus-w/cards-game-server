export interface Socket<OnData, EmitData> {
  on: (event: string, callback: (data: OnData) => void) => void;
  emit: (event: string, data: EmitData) => void;

  player?: Player;
}

export type Player = {
  id: string;
  username: string;
};

export type Game = {
  id: string;
  players: Player[];
};

export type AppData = {
  allSockets: Socket<any, any>[];
  players: Player[];
  games: Game[];
};

export enum SocketName {}
