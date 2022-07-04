require('module-alias/register')
import SqlService from "@root/app/services/SqlService";
import VariableItemService from "@root/app/services/VariableItemService";
import Sqlbricks from "@root/tool/SqlBricks";
import { AsyncJs } from "@root/tool";
import StartSqlite3 from "@root/bootstrap/StartSqlite3";

AsyncJs.series([
  StartSqlite3
], async function (err, result) {
  if (err) {
    return console.error(err);
  }
  let query = Sqlbricks.select("*").from("variables").where(Sqlbricks.isNotNull("data"));
  let resDatas = await SqlService.select(query.toString());
  for (var a = 0; a < resDatas.length; a++) {
    resDatas[a].data = JSON.parse(resDatas[a].data || '[]');
    resDatas[a].schema = JSON.parse(resDatas[a].schema || '[]');
  }
  for (let a = 0; a < resDatas.length; a++) {
    for (let b = 0; b < resDatas[a].data.length; b++) {
      let existVariableItem = await VariableItemService.getVariableItemByNameAndVariableID(resDatas[a].id, resDatas[a].data[b].name);
      if (existVariableItem == null) {
        await VariableItemService.addVariableItem({
          is_active: resDatas[a].data[b].is_active,
          datas: resDatas[a].data[b].datas,
          name: resDatas[a].data[b].name,
          variable_id: resDatas[a].id
        });
      } else {
        await VariableItemService.updateVariableItem({
          id: existVariableItem.id,
          is_active: resDatas[a].data[b].is_active,
          datas: resDatas[a].data[b].datas,
          name: resDatas[a].data[b].name,
          variable_id: resDatas[a].id
        });
      }
    }
  }
  process.exit(0);
})
