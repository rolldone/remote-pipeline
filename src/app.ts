
require('module-alias/register')
import minimist from "minimist";
import BaseStart, { BaseStartInterface } from './base/BaseStart';
import bootstrap from './bootstrap';
import { MasterDataInterface } from './bootstrap/StartMasterData';
import { Cli, Web } from './routes/v1';

declare var masterData: MasterDataInterface;

interface AppInterface extends BaseStartInterface {
  /* Todo some extra types */
}

/* Its working when enter to child_process with stedio inherit */
process.on('SIGINT', (props: any, props2: any) => {
  if (process.env.IS_PROCESS == "open_console") {
    process.exit();
    return;
  }
});

// Warning message from stack trace :
process.on('warning', e => console.warn(e.stack));

BaseStart({
  port: null,
  init: [
    /* Your code Bootstrap here */
    bootstrap,
    /* Your can define your own stack bootstrap here */
    function (callback: Function) {
      /* You can Define route here */
      Web.create(global.app);
      Cli.create(global.app);
      // Api.create(global.app);
      // Socket.create(global.app);
      // Redis.create(global.app);
      callback(null);
    },
    /* Listen the message request */
    function (callback: Function) {

      callback(null);
    }
  ],
  run: function () {
    process.setMaxListeners(100);
  }
} as AppInterface);