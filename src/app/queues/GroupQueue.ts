import { FlowJob, FlowProducer, JobNode } from "bullmq";

export interface GroupQueueInterface {
  group_queue_name: string
  childrens: Array<{
    name: string
    queue_name: string,
    data?: any
  }>
}
export default function (props: GroupQueueInterface) {
  const flow = new FlowProducer({
    connection: global.redis_bullmq
  });
  const originalTree = flow.add({
    name: 'group-queue',
    queueName: props.group_queue_name,
    data: {},
    children: (() => {
      let child: Array<FlowJob> = [];
      for (let a = 0; a < props.childrens.length; a++) {
        let queueItem = props.childrens[a];
        child.push({
          name: queueItem.queue_name,
          queueName: queueItem.queue_name,
          data: {},
        })
      }
      return child;
    })()
  })
  return originalTree;
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