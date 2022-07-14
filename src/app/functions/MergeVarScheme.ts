const MergeVarScheme = function (variable, scheme, extra = {}) {
  let mergeVarScheme = ((variable, schema) => {
    let jj = {};
    for (var a = 0; a < schema.length; a++) {
      // if (variable[a].is_active == true) {
      let isFound = false;
      switch (schema[a].type) {
        case 'input-asset':
          for (let b in variable) {
            if (variable[b].name == schema[a].name) {
              jj[schema[a].name] = variable[a].attachment_datas;
              isFound = true;
              break;
            }
          }
          break;
        case 'input-script':
          for (let b in variable) {
            if (variable[b].name == schema[a].name) {
              jj[schema[a].name] = variable[a].value;
              isFound = true;
              break;
            }
          }
          break;
        case 'input-text':
          for (let b in variable) {
            if (variable[b].name == schema[a].name) {
              jj[schema[a].name] = variable[a].value;
              isFound = true;
              break;
            }
          }
          break;
      }
      // }
      if (isFound == false) {
        switch (schema[a].type) {
          case 'input-asset':
            jj[schema[a].name] = schema[a].attachment_datas;
            break;
          case 'input-script':
            jj[schema[a].name] = schema[a].value;
            break;
          case 'input-text':
            jj[schema[a].name] = schema[a].value;
            break;
        }
      }
    }
    return {
      ...jj,
      ...extra
    };
  })(variable, scheme)
  return mergeVarScheme as any;
}

export default MergeVarScheme;