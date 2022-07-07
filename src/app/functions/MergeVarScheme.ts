const MergeVarScheme = function (variable, scheme, extra) {
  let mergeVarScheme = ((variable, schema) => {
    let jj = {};
    for (var a = 0; a < schema.length; a++) {
      // if (variable[a].is_active == true) {
        switch (schema[a].type) {
          case 'input-asset':
            for (let b in variable) {
              if (variable[b].name == schema[a].name) {
                jj[schema[a].name] = variable[a].attachment_datas;
                break;
              }
            }
            break;
          case 'input-script':
            for (let b in variable) {
              if (variable[b].name == schema[a].name) {
                jj[schema[a].name] = variable[a].value;
                break;
              }
            }
            break;
          case 'input-text':
            for (let b in variable) {
              if (variable[b].name == schema[a].name) {
                jj[schema[a].name] = variable[a].value;
                break;
              }
            }
            break;
        }
      // }
    }
    return {
      ...jj,
      ...extra
    };
  })(variable, scheme)
  return mergeVarScheme as any;
}

export default MergeVarScheme;