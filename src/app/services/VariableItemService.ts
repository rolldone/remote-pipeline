import Sqlbricks from "@root/tool/SqlBricks"
import CreateDate from "../functions/base/CreateDate"
import SafeValue from "../functions/base/SafeValue"
import SqlService from "./SqlService"

export interface VariableItemInterface {
  id?: number
  variable_id?: number
  name?: string
  datas?: any
  is_active?: boolean | number
  is_permanent?: boolean | number
  deleted_at?: string
  created_at?: string
  updated_at?: string

}

export interface VariableItemServiceInterface extends VariableItemInterface {
  ids?: Array<number>
  // Variables
  var_id?: number
  var_pipeline_id?: number
  var_project_id?: number
  var_user_id?: number
  var_name?: string
  var_schema?: any
  var_description?: string

  limit?: number
  offset?: number
}

const preSelectQuery = () => {
  Sqlbricks.aliasExpansions({
    'var_item': "variable_items",
    'var': "variables"
  });
  let query = Sqlbricks.select(
    "var_item.id as id",
    "var_item.variable_id as variable_id",
    "var_item.name as name",
    "var_item.datas as datas",
    "var_item.is_active as is_active",
    "var_item.created_at as created_at",
    "var_item.updated_at as updated_at",
    "var_item.deleted_at as deleted_at",
    "var.id as var_id",
    "var.pipeline_id as var_pipeline_id",
    "var.project_id as var_project_id",
    "var.user_id as var_user_id",
    "var.name as var_name",
    "var.schema as var_schema",
    "var.description as var_description"
  ).from("var_item");
  return query;
}

const returnFactoryColumn = (props: VariableItemServiceInterface) => {
  let resData = props;
  resData.datas = JSON.parse(resData.datas || '[]');
  resData.var_schema = JSON.parse(resData.var_schema || '[]')
  resData.is_active = resData.is_active == 1 ? true : false
  return resData;
}


const VariableItemService = {
  async addVariableItem(props: VariableItemInterface) {
    try {
      let query = Sqlbricks.insert("variable_items", CreateDate({
        variable_id: SafeValue(props.variable_id, null),
        name: SafeValue(props.name, null),
        datas: JSON.stringify(SafeValue(props.datas, [])),
        is_active: SafeValue(props.is_active, true),
        is_permanent: SafeValue(props.is_permanent, true),
      }));
      let resInsertId = await SqlService.insert(query.toString());
      let resVariableItem = await VariableItemService.getVariableItemById(resInsertId);
      return resVariableItem;
    } catch (ex) {
      throw ex;
    }
  },
  async updateVariableItem(props: VariableItemInterface) {
    try {
      let variableItemData: VariableItemInterface = await VariableItemService.getVariableItemById(props.id);
      if (variableItemData == null) {
        throw new Error("Variable item is not found!");
      }
      let query = Sqlbricks.update("variable_items", CreateDate({
        variable_id: SafeValue(props.variable_id, variableItemData.variable_id),
        name: SafeValue(props.name, variableItemData.name),
        datas: JSON.stringify(SafeValue(props.datas, variableItemData.datas)),
        is_active: SafeValue(props.is_active, variableItemData.is_active),
        is_permanent: SafeValue(props.is_permanent, variableItemData.is_permanent || true),
      }))
      query.where("id", props.id);
      let resUpdate = await SqlService.update(query.toString());
      let resData = await VariableItemService.getVariableItemById(props.id);
      return resData;
    } catch (ex) {
      throw ex;
    }
  },
  async deleteVariableItemByIds(ids: Array<number>) {
    try {
      Sqlbricks.aliasExpansions({
        "var": "variables",
        "var_item": "variable_items"
      });

      let query = Sqlbricks.delete('variable_items').where(Sqlbricks.in("id", ids)).toString();

      return SqlService.delete(query);
    } catch (ex) {
      throw ex;
    }
  },
  async getVariableItems(props: VariableItemServiceInterface) {
    try {
      let query = preSelectQuery();
      query
        .leftJoin("var").on("var.id", "var_item.variable_id")
      if (props.var_user_id != null) {
        query.where("var.user_id", props.var_user_id);
      }
      query.orderBy("var_item.id DESC");
      query.limit(props.limit || 50);
      query.offset((props.offset || 0) * (props.limit || 50));
      let resDatas = await SqlService.select(query.toString());
      for (var a = 0; a < resDatas.length; a++) {
        resDatas[a] = returnFactoryColumn(resDatas[a]);
      }
      return resDatas;
    } catch (ex) {
      throw ex;
    }
  },
  async getVariableItemsByVariableID(variable_id: number, props?: VariableItemServiceInterface) {
    try {
      let query = preSelectQuery();
      query
        .leftJoin("var").on("var.id", "var_item.variable_id")
      query.where("var_item.variable_id", variable_id);
      if (props.is_permanent != null) {
        query.where("var_item.is_permanent", props.is_permanent);
      }
      query.orderBy("var_item.id DESC");
      query.limit(props.limit || 50);
      query.offset((props.offset || 0) * (props.limit || 50));
      let resDatas = await SqlService.select(query.toString());
      for (var a = 0; a < resDatas.length; a++) {
        resDatas[a] = returnFactoryColumn(resDatas[a]);
      }
      return resDatas;
    } catch (ex) {
      throw ex;
    }
  },
  async getVariableItemByNameAndVariableID(variable_id: number, name: string) {
    try {
      console.log(variable_id, name);
      let query = preSelectQuery();
      query
        .leftJoin("var").on("var.id", "var_item.variable_id")
      query.where("var_item.name", name);
      query.where("var_item.variable_id", variable_id);
      let gg = query.toString();
      let resData = await SqlService.selectOne(gg);
      if (resData == null) return null;
      return returnFactoryColumn(resData);
    } catch (ex) {
      throw ex;
    }
  },
  async getVariableItemById(id: number) {
    try {
      let query = preSelectQuery();
      query
        .leftJoin("var").on("var.id", "var_item.variable_id")
      query.where("var_item.id", id);
      let resData = await SqlService.selectOne(query.toString());
      if (resData == null) return null;
      return returnFactoryColumn(resData);
    } catch (ex) {
      throw ex;
    }
  }
}

export default VariableItemService;