import { Socket, AppData } from '@/type/socket.types';

type Handler = {
  [key: string]: (param: any) => void;
};

type PossibleData = CreateGameData;

const warGame = (app: AppData, socket: Socket<{}, PossibleData>): Handler => ({
  'create-war-game': createGame(app, socket),
});

type CreateGameData = {};
type CreateGameFn = (app: AppData, socket: Socket<CreateGameData, {}>) => (data: CreateGameData) => void;

const createGame: CreateGameFn = (app, socket) => (data) => {
  // TODO : Create the game.
};

export default warGame;
