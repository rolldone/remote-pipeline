import { Job } from "bullmq";
import { Knex } from "knex";

declare let db: Knex;

export const onComplete = async (props: {
  job: Job
}) => {
  let {
    job
  } = props;
  
}

export const onActive = (props: {
  job: Job
}) => {
  let {
    job
  } = props;
  // Use set timeout for waiting complete on conCOmplete event on repeatable queue
  setTimeout(async () => {

  }, 3000);

}

export const onFailed = async (props: {
  job: Job
}) => {
  let {
    job
  } = props;
  // If last process
  if ((job.data.total - 1) == job.data.index) {
  }
}