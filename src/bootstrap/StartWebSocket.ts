import WebSocket, { WebSocketServer } from 'ws';
import http, { Server as TheServer } from 'http';
import Express from 'express';
import { MasterDataInterface } from './StartMasterData';

declare let Server: TheServer
declare let app: Express.Express
declare let masterData: MasterDataInterface;

export default function (next: Function) {

  const wss = new WebSocketServer({
    server: Server,
    // port: 8080,
    // perMessageDeflate: {
    //   zlibDeflateOptions: {
    //     // See zlib defaults.
    //     chunkSize: 1024,
    //     memLevel: 7,
    //     level: 3
    //   },
    //   zlibInflateOptions: {
    //     chunkSize: 10 * 1024
    //   },
    //   // Other options settable:
    //   clientNoContextTakeover: true, // Defaults to negotiated value.
    //   serverNoContextTakeover: true, // Defaults to negotiated value.
    //   serverMaxWindowBits: 10, // Defaults to negotiated value.
    //   // Below options specified as default values.
    //   concurrencyLimit: 10, // Limits zlib concurrency for perf.
    //   threshold: 1024 // Size (in bytes) below which messages
    //   // should not be compressed if context takeover is disabled.
    // }
  });

  global.wss = wss;
  app.use(function (req: any, res, next) {
    req.ws = wss;
    return next();
  });
  global.ws_client = {};
  let _ws_client = global.ws_client
  wss.on('connection', function connection(ws) {
    let wsClient = {
      key: null,
      ws
    }
    ws.onclose = function (event) {
      delete _ws_client[wsClient.key];
      console.log("Get onclose from :: ", wsClient.key);
    }
    ws.on('message', function message(data: any) {
      console.log('received: %s', data);
      try {
        let _data = JSON.parse(data);
        let _return = _data.return;
        switch (_data.action) {
          case 'join':
            // Add user id combination for make user this is for target user request
            wsClient.key = _return.key;
            if (_ws_client[_return.key] != null) {
              _ws_client[_return.key].ws.close();
            }
            _ws_client[_return.key] = wsClient;
            break;
        }
      } catch (ex) {
        console.error("connection - websocket - err :: ", ex);
      }
    });

    ws.send(JSON.stringify({
      action: "success",
      return: "Success join"
    }));
  });
  next();
}