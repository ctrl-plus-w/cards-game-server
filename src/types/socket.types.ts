export interface Socket<OnData, EmitData> {
  on: (event: string, callback: (data: OnData) => void) => void;
  emit: (event: string, data: EmitData) => void;
}

export type AppData = {
  allSockets: Socket<any, any>[];
};

export enum SocketName {}
