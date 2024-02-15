import { Server } from 'socket.io';
import { uuid } from 'uuidv4';

import Game from '@/class/Game';
import PlayingCard from '@/class/PlayingCard';

import { IntRange } from '@/type/index.types';
import { Socket, AppData, Player } from '@/type/socket.types';

import { shuffle } from '@/utils';

type Handler = {
  [key: string]: (param: any) => void;
};

const warGame = (app: AppData, socket: Socket<any, any>, io: Server): Handler => ({
  'create-war-game': createGame(app, socket, io),
  'join-war-game': joinGame(app, socket, io),
  'get-war-game': getWarGame(app, socket),
});

type CreateGameData = { owner: Player; maxPlayers: IntRange<2, 11> };
type CreateGameFn = (app: AppData, socket: Socket<CreateGameData, any>, io: Server) => (data: CreateGameData) => void;

const createGame: CreateGameFn = (app, socket, io) => (data) => {
  if (!socket.player || !data.owner || !data.maxPlayers) return;

  const id = uuid();

  const game = new Game(id, data.owner, data.maxPlayers);

  app.games[id] = game;
  socket.join(id);

  socket.emit('join-game', game.id);

  console.log('Game created:', game);
};

type JoinGameData = { gameId: string };
type JoinGameFn = (app: AppData, socket: Socket<JoinGameData, any>, io: Server) => (data: JoinGameData) => void;

const joinGame: JoinGameFn = (app, socket, io) => (data) => {
  const game = app.games[data.gameId];
  if (!socket.player || !game || game.players.length >= game.maxPlayers) return;

  app.games[game.id].players.push(socket.player);
  socket.join(game.id);

  socket.emit('join-game', game.id);

  if (game.players.length + 1 === game.maxPlayers) {
    const deck = shuffle(PlayingCard.generateDeck());

    while (deck.length) {
      for (let i = 0; i <= game.players.length; i++) {
        let id: string;

        if (i === game.players.length) id = game.owner.id;
        else id = game.players[i].id;

        const card = deck.pop();
        if (!card) break;

        if (id in game.playerCards) app.games[game.id].playerCards[id].push(card);
        else app.games[game.id].playerCards[id] = [card];
      }
    }
  }

  io.to(game.id).emit('war-game-update', app.games[game.id]);
};

type GetWarGameFn = (app: AppData, socket: Socket<never, any>) => (data: never) => void;

const getWarGame: GetWarGameFn = (app, socket) => (data) => {
  if (!socket.player) return;

  const id = socket.player.id;

  const game = Object.values(app.games).find((g) => !!g.players.find((p) => p.id === id) || g.owner.id === id);
  if (!game) return;

  socket.emit('war-game-update', game);
};

export default warGame;
