const CreateQueueName = (process_mode: string, id: number) => {
  return "queue_" + process_mode + "_" + id;
}

export default CreateQueueName;