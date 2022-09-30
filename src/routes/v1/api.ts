
import DashboardController from "@root/app/controllers/DashboardController";
import HomeController from "@root/app/controllers/HomeController";
import AuthController from "@root/app/controllers/xhr/AuthController";
import ConfigurationController from "@root/app/controllers/xhr/ConfigurationController";
import ExecutionController from "@root/app/controllers/xhr/ExecutionController";
import FileController from "@root/app/controllers/xhr/FileController";
import GroupController from "@root/app/controllers/xhr/GroupController";
import GroupUserController from "@root/app/controllers/xhr/GroupUserController";
import PipelineController from "@root/app/controllers/xhr/PipelineController";
import PipelineItemController from "@root/app/controllers/xhr/PipelineItemController";
import ProjectController from "@root/app/controllers/xhr/ProjectController";
import SqlQueryController from "@root/app/controllers/xhr/SqlQueryController";
import UserController from "@root/app/controllers/xhr/UserController";
import BaseRoute from "../../base/BaseRoute";

import multer from 'multer';
import QueueController from "@root/app/controllers/xhr/QueueController";
import WSocketController from "@root/app/controllers/WSocketController";
import QueueRecordController from "@root/app/controllers/xhr/QueueRecordController";
import QueueRecordDetailController from "@root/app/controllers/xhr/QueueRecordDetailController";
import OutSideAuth from "@root/app/middlewares/OutSideAuth";
import PipelineTaskController from "@root/app/controllers/xhr/PipelineTaskController";
import HostController from "@root/app/controllers/xhr/HostController";
import QueueRecordScheduleController from "@root/app/controllers/xhr/QueueRecordScheduleController";
import VariableController from "@root/app/controllers/xhr/VariableController";
import RepositoryController from "@root/app/controllers/xhr/RepositoryController";
import GithubAuth from "@root/app/middlewares/GithubAuth";
import WebHookController from "@root/app/controllers/xhr/WebHookController";
import WebhookAuth from "@root/app/middlewares/WebhookAuth";
import PersonalAccessTokenController from "@root/app/controllers/xhr/PersonalAccessTokenController";
import OutSideController from "@root/app/controllers/xhr/OutSideController";
import OAuthUserController from "@root/app/controllers/xhr/OAuthUserController";
import CredentialController from "@root/app/controllers/xhr/CredentialController";
import VariableItemController from "@root/app/controllers/xhr/VariableItemController";
import File2Controller from "@root/app/controllers/xhr/File2Controller";
import { FlydriveStorageEngine, MulterFlydriveOptionsFunction } from 'multer-flydrive-engine';
import { StorageManager } from "@slynova/flydrive";
import upath from 'upath';
import TokenDataAuth from "@root/app/middlewares/TokenDataGuestAuth";

declare let storage: StorageManager;

const storageTemp = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('storageTemp - destination :: ', file)
    cb(null, './storage/temp')
  },
  filename: function (req, file, cb) {
    console.log('storageTemp - filename :: ', file)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({
  storage: storageTemp
});

const storageTempUseFlyDrive = new FlydriveStorageEngine({
  async disk(req, file) {
    return storage.disk();// req.query.dest === 's3' ? storage.disk('s3') : storage.disk('local');
  },
  async destination(req, file) {
    let basePath = '/temp';
    return basePath;
  },
  async filename(req, file) {
    console.log('storageTemp - filename :: ', file)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    let gg = upath.normalize(uniqueSuffix + "-" + file.originalname);
    let newFile = {
      ...file,
      temp_name: gg
    }
    req.files = [newFile];
    return gg; // file.fieldname + '-' + Date.now();
  }
})

const upload2 = multer({
  storage: storageTempUseFlyDrive
})

export default BaseRoute.extend<BaseRouteInterface>({
  baseRoute: '/api',
  onready() {
    let self = this;
    self.use('/', [], function (route: BaseRouteInterface) {
      route.get("/dashboard*", "api.front.dashboard", [OutSideAuth], DashboardController.binding().displayView);
      route.get("/ws", "api.ws", [], WSocketController.binding().connect);
      route.get("/route", "api.display.route", [], route.displayRoute.bind(self));
      route.get("/personal-token/check/:token","api.token.check",[],PersonalAccessTokenController.binding().checkPersonalAccessToken);
    });

    self.use("/file2", [OutSideAuth], function (route: BaseRouteInterface) {
      route.post("/put", "api.file2.put", [function (req, res, next) {
        let _middleware = upload2.any()
        return _middleware(req, res, () => {
          // Remember, the middleware will call it's next function
          // so we can inject our controller manually as the next()
          console.log("res.body", req.body);
          console.log("req.files", req.files);
          if (!req.files) return res.json({ error: "invalid" })
          next()
        });
      }], File2Controller.binding().addFile);
      route.post("/mkdir", "api.file2.mkdir", [upload.any()], File2Controller.binding().addDir);
      route.post("/delete", "api.file2.delete", [upload.any()], File2Controller.binding().remove);
      route.post('/delete-by-ids', 'api.file2.delete_by_ids', [upload.any()], File2Controller.binding().removeByIds);
      route.post("/move", "api.file2.move", [upload.any()], File2Controller.binding().move)
      route.post("/copy", "api.file2.copy", [upload.any()], File2Controller.binding().copy)
      route.post("/duplicate", "api.file2.duplicate", [upload.any()], File2Controller.binding().duplicated)
      route.post("/rename", "api.file2.rename", [upload.any()], File2Controller.binding().rename)
      route.get("/files", "api.file2.files", [], File2Controller.binding().getFiles);
      route.get("/:id/view", "api.file2.file", [], File2Controller.binding().getFile);
      route.get("/display/:id", "api.file2.display", [], File2Controller.binding().display);
    });

    self.use('/queue', [OutSideAuth], function (route: BaseRouteInterface) {
      route.post("/delete-item", "api.queue.delete_item", [upload.any()], QueueController.binding().deleteQueueItem);
      route.post("/create-item", "api.queue.create_item", [upload.any()], QueueController.binding().createQueueItem);
      route.post("/create/:queue_key", "api.queue.create_by_queue_key", [upload.any()], OutSideController.binding().createQueue);
      route.post("/create", "api.queue.create", [upload.any()], QueueController.binding().createQueue);
      route.post("/update", "api.queue.update", [upload.any()], QueueController.binding().updateQueue);
      route.post("/delete", "api.queue.delete", [upload.any()], QueueController.binding().deleteQueue);
      route.post("/stop-worker", "api.queue.stop_worker", [upload.any()], QueueController.binding().stopWorker);
      route.post("/delete-scheduler", "api.queue.delete_scheduler", [upload.any()], QueueController.binding().deleteQueueScheduler);
      route.get("/queues", "api.queue.queues", [], QueueController.binding().getQueues);
      route.get("/:id/view", "api.queue.queue", [], QueueController.binding().getQueue);
    });

    self.use('/queue-record', [OutSideAuth], function (route: BaseRouteInterface) {
      route.get("/key/:id/view", "api.queue_record.queue_record", [], QueueRecordController.binding().getQueueRecordByKey);
    });

    self.use("/variable-item", [OutSideAuth], function (route: BaseRouteInterface) {
      route.post("/render", "api.variable_item.render", [upload.any()], VariableItemController.binding().renderVarScheme);
    });

    self.use("/configuration", [], function (route: BaseRouteInterface) {
      route.get("/", "api.configuration.configuration", [], ConfigurationController.binding().getConfiguration);
    });

    self.use("/guest", [TokenDataAuth], function (route: BaseRouteInterface) {
      route.get("/pipeline-task/pipeline-tasks", "api.guest.pipeline_task.pipeline_tasks", [], PipelineTaskController.binding().getPipelineTasks);
      route.get("/queue-record-detail/display-process", "api.guest.queue_record_detail.display_process", [], QueueRecordDetailController.binding().getDisplayProcess);
    });
  }
});