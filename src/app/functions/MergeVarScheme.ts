const MergeVarScheme = function (variable, scheme, extra) {
  let mergeVarScheme = ((variable, schema) => {
    let jj = extra || {};
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
  })(variable, scheme)
  return mergeVarScheme as any;
}

export default MergeVarScheme;