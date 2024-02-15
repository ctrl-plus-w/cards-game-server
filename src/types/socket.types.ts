import { Socket as _Socket } from 'socket.io';
import { EventsMap } from 'socket.io/dist/typed-events';

import Game from '@/class/Game';

export interface Socket<OnData extends EventsMap, EmitData extends EventsMap> extends _Socket<OnData, EmitData> {
  player?: Player;
}

export type Player = {
  id: string;
  username: string;
};

export type AppData = {
  allSockets: Socket<any, any>[];
  players: Player[];
  games: Game[];
};

export enum SocketName {}
