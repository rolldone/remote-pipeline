import { Job, Worker } from "bullmq";
import DiscordHook from "../functions/webhook/DiscordHook";
import { onActive, onComplete, onFailed } from "../functions/webhook/QueueEvent";
import SlackHook from "../functions/webhook/SlackHook";
import SmtpHook from "../functions/webhook/SmtpHook";
import WebhookHistoryService from "../services/WebhookHistoryService";
import serializeError from 'serialize-error';

const WebhookWorker = function (props: any) {
  const queueEvents = new Worker(props.queue_name, async (job: Job) => {
    console.log("job ::: ", job.data);
    let {
      type,
      data,
      item_info
    } = job.data;
    let job_id = job.id;
    try {
      console.log("type ::: ", type);
      switch (type) {
        case 'smtp':
          await SmtpHook({
            job_id,
            data,
            item_info
          });
          break;
        case 'slack':
          SlackHook({

          })
          break;
        case 'discord':
          await DiscordHook({
            data,
            job_id,
            item_info
          })
          break;
        case 'telegram':
          break;
      }
      // If Success record status success
      WebhookHistoryService.updateHistoryByJobId(job_id, {
        status: WebhookHistoryService.STATUS.SUCCESS
      });
    } catch (ex) {
      console.log(`${props.queue_name} - ex :: `, ex);
      // If failure record status failure

      WebhookHistoryService.updateHistoryByJobId(job_id, {
        status: WebhookHistoryService.STATUS.FAILED,
        error_message: JSON.stringify(serializeError.serializeError(ex))
      });
      return 'failed';
    }
    return 'done';
  }, {
    // autorun: false,
    concurrency: 1,
    connection: global.redis_bullmq,
    // prefix:"bullmq_"
  });

  queueEvents.on('active', (job) => {
    console.log(`Job ${job.id} is now active; previous status was ${job.id}`);
    onActive({ job });
  });

  queueEvents.on('completed', async (job) => {
    console.log(`${job.id} has completed and returned ${job.returnvalue}`);
    job.remove();
    onComplete({ job });
  });

  queueEvents.on('failed', async (job) => {
    console.log(`${job.id} has failed with reason ${job.failedReason}`);
    onFailed({ job });
  });
  return queueEvents;
}

export default WebhookWorker;