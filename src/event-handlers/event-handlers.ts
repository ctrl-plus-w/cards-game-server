import { Server } from 'socket.io';

import users from '@/handler/users';
import warGame from '@/handler/war-game';

import { AppData, Socket } from '@/type/socket.types';

const app: AppData = {
  allSockets: [],
  warGames: [],
  players: [],
};

export default (io: Server) => {
  io.on('connection', (socket: Socket<any, any>) => {
    const eventHandlers = [warGame(app, socket, io), users(app, socket)];

    // TODO : When connecting, redirect to the game page if the player is already in a game.

    eventHandlers.forEach((handler) => {
      for (let eventName in handler) {
        socket.on(eventName, handler[eventName]);
      }
    });

    // Keep track of the socket
    app.allSockets.push(socket);
  });

  // io.on('disconnect', (socket) => {
  //   if (!socket.player) return;
  //
  //   const playerIndex = app.players.findIndex((player) => player.id === socket.player.id);
  //   delete app.players[playerIndex];
  //
  //   const gameIndex = app.games.findIndex((game) => !!game.players.find((player) => player.id === socket.player.id));
  //   const gamePlayerIndex = app.games[gameIndex].players.findIndex((player) => player.id === socket.player.id);
  //   delete app.games[gameIndex].players[gamePlayerIndex];
  //
  //   socket.to(app.games[gameIndex].id).emit('player-left', socket.player);
  //
  //   const socketId = app.allSockets.findIndex((s) => s.id === socket.id);
  //   delete app.allSockets[socketId];
  // });
};
