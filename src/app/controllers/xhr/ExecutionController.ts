import BaseController from "@root/base/BaseController"

export interface ExecutionControllerInterface extends BaseControllerInterface {
  addExecution: { (req: any, res: any): void }
  updateExecution: { (req: any, res: any): void }
  deleteExecution: { (req: any, res: any): void }
  getExecutions: { (req: any, res: any): void }
  getExecution: { (req: any, res: any): void }
}

export default BaseController.extend<ExecutionControllerInterface>({
  addExecution(req, res) {
    // project_id: int
    // configuration_id: int
    // type: string INSTANCE|PERIODE
    // is_active: boolean
    // running_type: string manually|datetime|time|countdown
    // running_value: string null|01:02:2022 00:00:00|01:00:00|9000
    // running_mode: string recursive|onetime
  },
  updateExecution(req, res) {
    // id: int
    // project_id: int
    // configuration_id: int
    // type: string INSTANCE|PERIODE
    // is_active: boolean
    // running_type: string manually|datetime|time|countdown
    // running_value: string null|01:02:2022 00:00:00|01:00:00|9000
    // running_mode: string recursive|onetime
  },
  deleteExecution(req, res) {
    // ids: JSON []
  },
  getExecutions(req, res) {
    // where_by: string
    // page: int
    // limit: int
  },
  getExecution(req, res) {
    // id: int
  },
});