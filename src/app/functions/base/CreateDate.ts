import SafeValue from "./SafeValue";

const CreateDate = (props: {
  [key: string]: any
  created_at?: string
  updated_at?: string
}) => {
  let _date = new Date().toISOString().slice(0, 19).replace('T', ' ');
  return {
    ...props,
    created_at: SafeValue(props.created_at, _date),
    updated_at: _date
  }
}

export default CreateDate;