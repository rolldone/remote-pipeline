import upath from 'upath';
import cron from 'node-cron';

/* Start cron job */
export default function (next: Function) {
  let promise = () => {

    // cron.schedule('* * * * *', function () {
    //   console.log("running a task every 1 minute", new Date().getMinutes());
    // });

    next();
  }

  promise();
}