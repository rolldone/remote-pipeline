import { MasterDataInterface } from "@root/bootstrap/StartMasterData";
import BaseRouteCli from "@root/base/BaseRouteCli";
import BasicExecutionWorker from "@root/app/workers/BasicExecutionWorker";
import { Worker } from "bullmq";
import ParallelExecutionWorker from "@root/app/workers/ParallelExecutionWorker";
import GroupExecutionWorker from "@root/app/workers/GroupExecutionWorker";

declare var masterData: MasterDataInterface;

export interface QueueRequestInterface {
  queue_name?: string
  data?: any
  callback?: Function
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
      console.log("QueueRequestInterface :: ", props);
      if(props == null) return;
      if (_basicExecutions[props.queue_name] == null) {
        _basicExecutions[props.queue_name] = BasicExecutionWorker({
          ...props.data,
          queue_name: props.queue_name,
        });
      }
      props.callback(_basicExecutions[props.queue_name]);
    }, false);
    /**
     * Listen only parallel queue
     */
    masterData.setOnListener('queue.request.parallel', function (props: QueueRequestInterface) {
      if(props == null) return;
      if (_parallelExecutions[props.queue_name] == null) {
        _parallelExecutions[props.queue_name] = ParallelExecutionWorker({
          ...props.data,
          queue_name: props.queue_name,
        });
      }
      props.callback(_parallelExecutions[props.queue_name]);
    }, false);

    masterData.setOnListener('queue.request.flow.sequential', function (props: QueueRequestInterface) {
      if(props == null) return;
      if (_basicGroupExecutions[props.queue_name] == null) {
        _basicGroupExecutions[props.queue_name] = GroupExecutionWorker({
          ...props.data,
          queue_name: props.queue_name,
        });
      }
      props.callback(_parallelExecutions[props.queue_name]);
    })
    /**
     * Call all queues
     */
    masterData.setOnListener('queue.request.queues', function (props: QueueRequestInterface) {
      if(props == null) return;
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
  }
});

export default Cli;
