import { Socket, AppData, Player } from '@/type/socket.types';

type Handler = {
  [key: string]: (param: any) => void;
};

type PossibleData = ProfileOpData;

const users = (app: AppData, socket: Socket<PossibleData, {}>): Handler => ({
  'create-profile': createProfile(app, socket),
  'set-profile': setProfile(app, socket),
  'delete-profile': deleteProfile(app, socket),
});

type ProfileOpData = Player;
type ProfileOpFn = (app: AppData, socket: Socket<ProfileOpData, {}>) => (data: ProfileOpData) => void;

const createProfile: ProfileOpFn = (app, socket) => (data) => {
  console.log(`Created a profile with id: '${data.id}' and username: '${data.username}'. `);

  app.players.push(data);
  socket.player = data;
};

const setProfile: ProfileOpFn = (app, socket) => (data) => {
  console.log(`Set profile with id: '${data.id}' and username: '${data.username}'. `);

  const index = app.players.findIndex((player) => player.id === data.id);
  if (index === -1) app.players.push(data);
  socket.player = data;
};

const deleteProfile: ProfileOpFn = (app, socket) => (data) => {
  console.log(`Deleted profile with id: '${data.id}'. `);

  const index = app.players.findIndex((player) => player.id === data.id);
  delete app.players[index];

  socket.player = undefined;
};

export default users;
