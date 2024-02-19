import { Socket as _Socket } from 'socket.io';
import { EventsMap } from 'socket.io/dist/typed-events';

import WarGame from '@/class/WarGame';

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
  games: WarGame[];
};

export enum SocketName {}
