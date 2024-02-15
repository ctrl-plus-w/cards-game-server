import * as debug from 'debug';
import * as dotenv from 'dotenv';
import * as http from 'http';
import { Server } from 'socket.io';

import socketIoHandlers from '@/handler/event-handlers';

import { normalizePort } from '@/utils';

dotenv.config();

const onError = (error: NodeJS.ErrnoException): void => {
  if (error.syscall !== 'listen') throw error;
  let bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      return process.exit(1);

    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      return process.exit(1);

    default:
      throw error;
  }
};

const onListening = (): void => {
  console.log(`listening on port ${port}!`);
  console.log(`PROD mode is ${process.env.PRODUCTON ? 'ON' : 'OFF'}`);
  let addr = server.address();

  if (addr && typeof addr !== 'string') {
    let bind = `port ${addr?.port}`;
    debug(`Listening on port ${bind}`);
  }
};

const port = normalizePort(process.env.PORT || 3000);

const server = http.createServer();
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

// socket.io handlers
let io = new Server(server, {});
socketIoHandlers(io);
