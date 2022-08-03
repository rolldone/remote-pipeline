import { FlowJob, FlowProducer, JobNode } from "bullmq";

export interface GroupQueueInterface {
  // group_queue_name: string
  // childrens: Array<{
  //   name: string
  //   queue_name: string,
  //   data?: any
  // }>
}

const GroupQueue = function (props: GroupQueueInterface) {
  const flow = new FlowProducer({
    connection: global.redis_bullmq,
    // prefix: "bullmq_",
  });

  return flow;
  // let _queue = new FlowProducer(props.queue_name, {
  //   connection: global.redis_bullmq,
  //   // prefix: "bullmq_",
  //   defaultJobOptions: {
  //     removeOnComplete: true, removeOnFail: 1000
  //   }
  // })
  // await _queue.add("basic", data, {
  //   jobId: id,
  //   timeout: 5000
  // });
}

export default GroupQueue;