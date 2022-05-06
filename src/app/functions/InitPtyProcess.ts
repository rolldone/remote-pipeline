var pty = require('node-pty');
import { IPty } from 'node-pty';
var size = require('window-size');
var os = require('os');

const InitPtyProcess = function (props: [], authOpts: any) {
  var shell = os.platform() === 'win32' ? "C:\\Program Files\\Git\\bin\\bash.exe" : 'bash';
  let _ptyProcess = pty.spawn(shell, props, {
    name: 'xterm-color',
    // cols: process.stdin.width,
    // rows: process.stdin.height,
    cwd: process.env.HOME,
    env: {
      /* Fill from parent process.env */
      ...process.env,
      /* Override for this value */
      IS_PROCESS: "open_console"
    },
    handleFlowControl: true
  });
  // _ptyProcess.write('cd ' + this._currentConf.localPath + '\r');
  _ptyProcess.on('data', (data: string) => {
    // console.log(data)
    /* Disable pty stdout print */
    // process.stdout.write(data);
    

    // switch (true) {
    //   case data.includes('Are you sure you want to continue connecting'):
    //     _ptyProcess.write('yes\r')
    //     break;
    //   case data.includes('Enter passphrase for key'):
    //   case data.includes('password:'):
    //     _ptyProcess.write(authOpts.password + '\r')
    //     break;
    //   case data.includes('total size'):
    //     _ptyProcess.write('exit' + '\r')
    //     break;
    //   case data.includes('No such file or directory'):
    //   case data.includes('rsync error:'):
    //     _ptyProcess.write('exit' + '\r')
    //     break;
    // }

  });
  const resizeFunc = function () {
    let { width, height } = size.get();
    _ptyProcess.resize(width, height)
  }
  // process.stdout.on('resize', resizeFunc);
  _ptyProcess.on('exit', (exitCode: any, signal: any) => {
    //  process.stdout.removeListener('resize', resizeFunc);
  });
  return _ptyProcess;
}

export default InitPtyProcess;