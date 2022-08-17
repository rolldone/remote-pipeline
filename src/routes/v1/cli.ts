import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import BaseRouteCli from "@root/base/BaseRouteCli";
import BasicExecutionWorker from "@root/app/workers/BasicExecutionWorker";
import { Worker } from "bullmq";
import ParallelExecutionWorker from "@root/app/workers/ParallelExecutionWorker";
import GroupExecutionWorker from "@root/app/workers/GroupExecutionWorker";
import WebhookWorker from "@root/app/workers/WebhookWorker";

declare var masterData: MasterDataInterface;

export interface QueueRequestInterface {
  queue_name: string
  process_limit: number
  callback: Function
}

export interface QueueWebhookInterface {
  queue_name?: string
  data?: any
  callback?: Function
  process_limit?: number
}

const Cli = BaseRouteCli.extend<BaseRouteInterface>({
  baseRoute: '',
  onready() {
    let self = this;
    let _parallelExecutions: {
      [key: string]: Worker
    } = {};
    let _basicExecutions: {
      [key: string]: Worker
    } = {};
    let _basicGroupExecutions: {
      [key: string]: Worker
    } = {};
    /**
      * Listen only basic queue
      */
    masterData.setOnListener('queue.request.sequential', function (props: QueueRequestInterface) {
      // console.log("QueueRequestInterface :: ", props);
      if (props == null) return;
      let run = () => {
        _basicExecutions[props.queue_name] = BasicExecutionWorker({
          queue_name: props.queue_name,
        });
      }
      if (_basicExecutions[props.queue_name] == null) {
        run();
      } else {
        console.log("_basicExecutions[props.queue_name].isRunning() :: ", _basicExecutions[props.queue_name].isRunning());
        if (_basicExecutions[props.queue_name].isRunning() == false) {
          run();
        }
      }
      props.callback(_basicExecutions[props.queue_name]);
    }, false);
    /**
     * Listen only parallel queue
     */
    masterData.setOnListener('queue.request.parallel', function (props: QueueRequestInterface) {
      console.log("QueueRequestInterface :: ", props);
      if (props == null) return;
      let run = () => {
        _parallelExecutions[props.queue_name] = ParallelExecutionWorker({
          queue_name: props.queue_name,
          process_limit: props.process_limit
        });
      }
      if (_parallelExecutions[props.queue_name] == null) {
        run();
      } else {
        if (_parallelExecutions[props.queue_name].isRunning() == false) {
          run();
        }
      }
      props.callback(_parallelExecutions[props.queue_name]);
    }, false);

    masterData.setOnListener('queue.request.flow.sequential', function (props: QueueRequestInterface) {
      if (props == null) return;
      let run = () => {
        _basicGroupExecutions[props.queue_name] = GroupExecutionWorker({
          queue_name: props.queue_name,
        });
      }
      if (_basicGroupExecutions[props.queue_name] == null) {
        run();
      } else {
        if (_basicGroupExecutions[props.queue_name].isRunning() == false) {
          run();
        }
      }
      props.callback(_parallelExecutions[props.queue_name]);
    })
    /**
     * Call all queues
     */
    masterData.setOnListener('queue.request.queues', function (props: QueueRequestInterface) {
      if (props == null) return;
      let _gg = [];
      let allQue = {
        ..._parallelExecutions,
        ..._basicExecutions
      };
      for (var key in allQue) {
        _gg.push({
          jobId: allQue[key].name,
          status: function () {
            if (allQue[key].isPaused()) {
              return 'paused';
            }
            if (allQue[key].isRunning()) {
              return 'running';
            }
          }
        })
      }
      props.callback(_gg);
    })
    /**
     * Call all queues
     */
    masterData.setOnListener('queue.request.queue', function (props: QueueRequestInterface) {
      let _gg = null;
      let allQue = {
        ..._parallelExecutions,
        ..._basicExecutions
      };
      for (var key in allQue) {
        if (key == props.queue_name) {
          _gg = {
            jobId: allQue[key].name,
            status: function () {
              if (allQue[key].isPaused()) {
                return 'paused';
              }
              if (allQue[key].isRunning()) {
                return 'running';
              }
            }
          }
          break;
        }
      }
      props.callback(_gg);
    })

    /** 
     * Call webhook Queue For testing
     */
    masterData.setOnListener('queue.webhook.execute.item.test', function (props: QueueWebhookInterface) {
      // console.log("QueueRequestInterface :: ", props);
      if (props == null) return;
      let run = () => {
        _basicExecutions[props.queue_name] = WebhookWorker({
          ...props.data,
          queue_name: props.queue_name,
        });
      }
      if (_basicExecutions[props.queue_name] == null) {
        run();
      } else {
        if (_basicExecutions[props.queue_name].isRunning() == false) {
          run();
        }
      }
      props.callback(_basicExecutions[props.queue_name]);
    }, false);

    /**
     * Call webhook with key
     */
    masterData.setOnListener('queue.webhook.execute', function (props: QueueWebhookInterface) {
      // console.log("QueueRequestInterface :: ", props);
      if (props == null) return;
      let run = () => {
        _basicExecutions[props.queue_name] = WebhookWorker({
          ...props.data,
          queue_name: props.queue_name,
        });
      }
      if (_basicExecutions[props.queue_name] == null) {
        run();
      } else {
        if (_basicExecutions[props.queue_name].isRunning() == false) {
          run();
        }
      }
      props.callback(_basicExecutions[props.queue_name]);
    }, false);
  }
});

export default Cli;
