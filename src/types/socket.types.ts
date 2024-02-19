import { Socket as _Socket } from 'socket.io';
import { EventsMap } from 'socket.io/dist/typed-events';

import Take6Game from '@/class/Take6Game';
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
  warGames: WarGame[];
  take6Games: Take6Game[];
};

export enum SocketName {}
