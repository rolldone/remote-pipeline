import { randomUUID } from 'crypto';
import { debounce, DebouncedFunc, pullAt } from 'lodash';
import ssh, { Client } from 'ssh2';
import PortFree from './PortFree';
import CreateUUID from './CreateUUID';
import ssh2Stream from 'ssh2-streams';

export type SftpSsh2 = {
  stat: { (path: string): Promise<ssh2Stream.Stats> }
  rmdir: { (path: string): Promise<ssh2Stream.Stats> }
  unlink: { (path: string): Promise<ssh2Stream.Stats> }
  mkdir: { (path: string, attributes?: ssh2Stream.InputAttributes): Promise<string> }
  readdir: { (path: string): Promise<ssh2Stream.FileEntry[]> }
  readFile: { (path: string): Promise<Buffer> }
  fastPut: { (localPath: string, remotePath: string, options?: ssh2Stream.TransferOptions): Promise<boolean> }
  put: { (localPath: string, remotePath: string, options?: ssh2Stream.TransferOptions): Promise<boolean> }
  fastGet: { (remotePath: string, localPath: string, options?: ssh2Stream.TransferOptions): Promise<boolean> }
  writeFile: { (remotePath: string, localPath: string): Promise<boolean> }
  chmod: { (remotePath: string, mode: string | number): Promise<boolean> }
}

class Ssh2 {
  getOnReadyListener: Function = null
  sftp(): Promise<SftpSsh2> {
    return new Promise((resolve: Function, reject: Function) => {
      this.client.sftp((err, sftp) => {
        if (err) {
          return reject(err);
        };
        resolve({
          stat: (path: string) => {
            return new Promise((resolve: Function, reject: Function) => {
              sftp.stat(path, (err, stats) => {
                if (err) {
                  return reject(err);
                }
                resolve(stats);
              })
            });
          },
          mkdir: (path: string, attributes) => {
            return new Promise((resolve: Function, reject: Function) => {
              sftp.mkdir(path, attributes, (err) => {
                if (err) {
                  return reject(err);
                }
                resolve(path);
              })
            });
          },
          rmdir: (path: string, attributes) => {
            return new Promise((resolve: Function, reject: Function) => {
              sftp.rmdir(path, (err) => {
                if (err) {
                  return reject(err);
                }
                resolve(path);
              })
            });
          },
          unlink: (path: string, attributes) => {
            return new Promise((resolve: Function, reject: Function) => {
              sftp.unlink(path, (err) => {
                if (err) {
                  return reject(err);
                }
                resolve(path);
              })
            });
          },
          readdir: (path: string) => {
            return new Promise((resolve: Function, reject: Function) => {
              sftp.readdir(path, (err, list) => {
                if (err) {
                  return reject(err);
                }
                resolve(list);
              })
            });
          },
          readFile: (path: string) => {
            return new Promise((resolve: Function, reject: Function) => {
              sftp.readFile(path, (err, handle) => {
                if (err) {
                  return reject(err);
                }
                resolve(handle);
              })
            });
          },
          fastPut: (localPath: string, remotePath: string, options) => {
            return new Promise((resolve: Function, reject: Function) => {
              sftp.fastPut(localPath, remotePath, options, (err) => {
                if (err) {
                  return reject(err);
                }
                resolve(true);
              })
            });
          },
          fastGet: (remotePath: string, localPath: string, options) => {
            return new Promise((resolve: Function, reject: Function) => {
              sftp.fastGet(remotePath, localPath, options, (err) => {
                if (err) {
                  return reject(err);
                }
                resolve(true);
              })
            });
          },
          writeFile: (remotePath: string, data: string | Buffer) => {
            return new Promise((resolve: Function, reject: Function) => {
              sftp.writeFile(remotePath, data, (err) => {
                if (err) {
                  return reject(err);
                }
                return resolve(true);
              })
            });
          },
          chmod: (path: string, mode: string | number) => {
            return new Promise((resolve: Function, reject: Function) => {
              sftp.chmod(path, mode, (err) => {
                if (err) {
                  return reject(err);
                }
                return resolve(true);
              })
            });
          }
        });
      });
    })
  }
  private stream: ssh.ClientChannel = null
  client: Client = null
  clients: Array<Client> = []
  connection: any = null
  connections: Array<ssh.ConnectConfig> = []
  constructor(props: Array<ssh.ConnectConfig> | ssh.ConnectConfig) {
    if (Array.isArray(props) == true) {
      this.connections = props as Array<ssh.ConnectConfig>;
      // this.connections.reverse();
      return;
    }
    console.log("kena disini :: ", props);
    this.connections = [props] as Array<ssh.ConnectConfig>;
  }
  connect(): Promise<Client> {
    return new Promise((resolve: Function, reject: Function) => {
      try {
        console.log('Client :: Connecting');
        if (this.connections.length > 0) {
          for (let conA1 = 0; conA1 < this.connections.length; conA1++) {
            let clientItem = new ssh.Client();
            this.clients.push(clientItem);
          }
          for (let conA1 = 0; conA1 < this.connections.length; conA1++) {
            let clientItem = this.clients[conA1];
            clientItem.on("error", (err) => {
              if (err.level === "client-timeout") {
                // Reject the promise with a timeout error
                reject(new Error("SSH client timed out"));
              } else {
                // Reject the promise with the actual error
                reject(err);
              }
            });
            clientItem.on("ready", async () => {
              console.log('Connection :: ' + (conA1) + ' :: connection ready');
              // Alternatively, you could use something like netcat or socat with exec()
              // instead of forwardOut(), depending on what the server allows
              let freePort = await PortFree();
              if (this.clients[conA1 + 1] != null) {
                clientItem.forwardOut('127.0.0.1', freePort, this.connections[conA1 + 1].host, this.connections[conA1 + 1].port, (err, stream) => {
                  if (err) {
                    console.log('FIRST :: forwardOut error: ' + err);
                    return clientItem.end();
                  }
                  if (this.clients[conA1 + 1] != null) {
                    console.log('Client :: ' + (conA1 + 1) + ' :: Connecting');
                    this.clients[conA1 + 1].connect({
                      ...this.connections[conA1 + 1],
                      sock: stream,
                    });
                  } else { }
                });
              } else {
                console.log('Client :: ready');
                this.client = clientItem;
                this.stream = await this.shell();

                resolve(clientItem);
              }
            });
          }
          // Start from index 0
          this.clients[0].connect(this.connections[0]);
          return;
        }
        this.client = new ssh.Client();
        this.client.on("error", (err) => {
          if (err.level === "client-timeout") {
            // Reject the promise with a timeout error
            reject(new Error("SSH client timed out"));
          } else {
            // Reject the promise with the actual error
            reject(err);
          }
        });
        this.client.on("ready", async () => {
          this.getOnReadyListener();
          console.log('Client :: ready');
          this.stream = await this.shell();
          resolve(this.client);
        });
        this.client.connect(this.connection);
      } catch (ex) {
        reject(ex);
      }
    });
  }
  disconect() {
    return new Promise((resolve: Function, reject: Function) => {
      try {
        this.client.on("close", () => {
          console.log("Ssh is disconect!");
          resolve();
        });
        this.client.end();
      } catch (ex) {
        reject(ex);
      }
    });
  }
  private shell(): Promise<ssh.ClientChannel> {
    return new Promise((resolve: Function, reject: Function) => {
      this.client.shell((err, stream) => {
        if (err) {
          return reject(err);
        }
        stream.on("data", (data) => {
          console.log("global :: ", data.toString());
        })
        resolve(stream);
      });
    })
  }
  off(whatListen: 'ready' | 'data' | 'close' | 'exit' | 'exit-status' | 'extended', listener: { (...args: any[]): void }) {
    switch (whatListen) {
      case 'ready':
        this.client.off("ready", listener);
        break;
      case 'data':
        this.stream.off("data", listener);
        break;
      case 'close':
        this.stream.off("close", listener);
        break;
      case 'exit':
        this.stream.off("exit", listener);
        break;
      case 'exit-status':
        this.stream.off("exit", listener);
        break;
      case 'extended':
        this.stream.off("extended", listener);
        break;
    }
  }
  on(whatListen: 'ready' | 'data' | 'close' | 'exit' | 'error-command' | 'extended', callbac: Function) {
    switch (whatListen) {
      case 'ready':
        this.getOnReadyListener = callbac;
        break;
      case 'data':
        this.stream.on("data", callbac);
        break;
      case 'close':
        this.stream.on("close", callbac);
        break;
      case 'exit':
        this.stream.on("exit", callbac);
        break;
    }
  }
  write(data: string, callback?: { (stream: ssh.ClientChannel, done: Function, data: Buffer): Promise<void> }) {
    let hisString = "";
    let pendingResolve: DebouncedFunc<any> = null;
    return new Promise((resolve: Function, reject: Function) => {

      let whatListenerFuncExec = (data: Buffer) => {
        if (pendingResolve != null) {
          pendingResolve.cancel();
        }
        pendingResolve = debounce((data: Buffer) => {
          let stringCollection = data.toString().split('\r');
          stringCollection.reverse();
          this.stream.off("data", whatListenerFuncExec);
        }, 2000);
        pendingResolve(data);
        hisString += data.toString();
      }

      data = data.replace("\r", "");

      let dataArr = data.split("&&");
      dataArr = dataArr.map((val) => val.replace(/\s/g, ''));

      this.client.exec(data, { pty: true }, (err, stream) => {
        if (err) {
          console.log('this.client.exec :: ', err);
          return;
        }
        if (callback != null) {
          stream.on('data', (data) => {
            hisString += data.toString();
            callback.call(null, stream, resolve, data);
          });
        } else {
          stream.on('data', whatListenerFuncExec);
        }

        stream.stderr.on('data', (data) => {
          // Handle error output, if any
          // console.error(`Error output: ${data.toString()}`);
          stream.off('data', whatListenerFuncExec);

          let error = new Error(`Error output: ${data.toString()}`);
          reject(error);
        });

        stream.on('close', (code, signal) => {
          // Handle command completion or termination
          // console.log(`Command completed with exit code ${code}`);

          console.log('stream.on(close) :: ', code, signal);

          if (code > 0) {
            let error = new Error("Error code :: " + code);
            reject(error);
            return;
          }

          dataArr.forEach((val, i) => {
            if (val == "exit") {
              if (code == 0) {
                let error = new Error(code);
                return reject(error);
              }
            }
          })

          resolve("")
        });

        stream.on('exit', function (code) { });
      });
    })
  }
}

export default Ssh2;