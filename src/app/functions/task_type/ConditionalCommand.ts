import SSH2Promise from "ssh2-promise";
import mustache from 'mustache';

export default function (props: {
  sshPromise: SSH2Promise,
  variable: any
  schema: any
  pipeline_task: any
}) {
  let {
    sshPromise,
    variable,
    schema,
    pipeline_task
  } = props;
  let mergeVarScheme = ((variable, schema) => {
    let jj = {};
    for (var a = 0; a < schema.length; a++) {
      if (variable[a].is_active == true) {
        switch (schema[a].type) {
          case 'input-asset':
            jj[schema[a].name] = variable[a].attachment_datas;
            break;
          case 'input-script':
            jj[schema[a].name] = variable[a].value;
            break;
          case 'input-text':
            jj[schema[a].name] = variable[a].value;
            break;
        }
      }
    }
    return jj;
  })(variable, schema)
  //let rederJadi = mustache.render()  
  // console.log("mergeVarScheme :: ", mergeVarScheme);
  console.log("props conditional-command ::: ", props);
}