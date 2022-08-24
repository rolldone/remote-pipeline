import HostService from '@root/app/services/HostService';
import Monitor from 'ping-monitor';
import { MasterDataInterface } from './StartMasterData';

declare var masterData: MasterDataInterface;

let recordHost = {};

export default function (next: Function) {
  let promise = async () => {
    let checkHost = async () => {
      let host_datas = await HostService.getAllHosts_GroupAddressPort();
      console.log("host_datas : ", host_datas);
      for (let a = 0; a < host_datas.length; a++) {
        for (let a1 = 0; a1 < host_datas[a].data.length; a1++) {
          let hostItem = host_datas[a].data[a1];
          if (recordHost[hostItem.host + ':' + hostItem.port] == null) {
            if (hostItem.status == false) {
              break;
            }
            recordHost[hostItem.host + ':' + hostItem.port] = hostItem;
          } else {
            console.log("hostItem :: ", hostItem);
            recordHost[hostItem.host + ':' + hostItem.port] = {
              ...recordHost[hostItem.host + ':' + hostItem.port],
              ...hostItem
            }
          }
        }
      }
      for (var i in recordHost) {
        if (recordHost[i].is_checked == null) {
          if (recordHost[i].status == false) {
            break;
          }
          recordHost[i].is_checked = true;

          const myMonitor = new Monitor({
            address: recordHost[i].host,
            port: recordHost[i].port,
            interval: 30 // minutes
          });

          myMonitor.on('up', function (res, state) {
            console.log('Yay!! ' + res.address + ':' + res.port + ' is up.');
            let hostInfo = masterData.getData("host.info", {});
            hostInfo[res.address + ':' + res.port] = 'up';
            masterData.saveData("host.info", hostInfo)
          });

          myMonitor.on('down', function (res, state) {
            console.log('Oh Snap!! ' + res.address + ':' + res.port + ' is down! ');
            let hostInfo = masterData.getData("host.info", {});
            hostInfo[res.address + ':' + res.port] = 'down';
            masterData.saveData("host.info", hostInfo)
          });

          myMonitor.on('stop', function (res, state) {
            console.log(res.address + ' monitor has stopped.');
            let hostInfo = masterData.getData("host.info", {});
            delete hostInfo[res.address + ':' + res.port];
            masterData.saveData("host.info", hostInfo)
          });

          myMonitor.on('error', function (error, res) {
            console.log(error);
            let hostInfo = masterData.getData("host.info", {});
            delete hostInfo[res.address + ':' + res.port];
            masterData.saveData("host.info", hostInfo)
          });

          myMonitor.on('timeout', function (error, res) {
            console.log(error);
            let hostInfo = masterData.getData("host.info", {});
            delete hostInfo[res.address + ':' + res.port];
            masterData.saveData("host.info", hostInfo)
          });

          recordHost[i].my_monitor = myMonitor;
        }
        console.log("recordHost[i].status ::  ", recordHost[i].status);
        if (recordHost[i].status == false) {
          if (recordHost[i].my_monitor != null) {
            recordHost[i].my_monitor.stop();
            delete recordHost[i];
            console.log('Host ' + i, " Stopped!");
          }
          let hostInfo = masterData.getData("host.info", {});
          if (hostInfo[i] != null) {
            delete hostInfo[i];
            masterData.saveData("host.info", hostInfo)
          }
        }
      }
      console.log("recordHost :: ", recordHost);
    }

    await checkHost();

    masterData.setOnListener("host.add", (val) => {
      console.log("Start to check again");
      checkHost();
    })

    masterData.setOnListener("host.clear", async (val) => {
      for (var i in recordHost) {
        if (recordHost[i] != null) {
          if (recordHost[i].my_monitor != null) {
            recordHost[i].my_monitor.stop();
            delete recordHost[i];
          }
        }
      }
      await masterData.saveData("host.info", {});
      await checkHost();
      console.log("Clear it!");
    })
    next();
  }
  promise();
}