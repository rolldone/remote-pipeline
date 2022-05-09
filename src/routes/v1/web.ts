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
import DashboardAuth from "@root/app/middlewares/DashboardAuth";

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

export default BaseRoute.extend<BaseRouteInterface>({
  baseRoute: '',
  onready() {
    let self = this;
    self.use('/', [], function (route: BaseRouteInterface) {
      route.get('', 'front.index', [], HomeController.binding().displayIndex);
      route.get("/dashboard/login", "front.dashboard.login", [], DashboardController.binding().displayView);
      route.get("/dashboard/register", "front.dashboard.register", [], DashboardController.binding().displayView);
      route.get("/dashboard*", "front.dashboard", [DashboardAuth], DashboardController.binding().displayView);
      route.get("/ws", "ws", [], WSocketController.binding().connect);
      route.get("/route", "display.route", [], route.displayRoute.bind(self));
    });

    self.use('/xhr/file', [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.file.add", [function (req, res, next) {
        console.log("before-multer-res.body", req.body);
        console.log("before-multer-req.file", req.files)
        let _middleware = upload.any()
        return _middleware(req, res, () => {
          // Remember, the middleware will call it's next function
          // so we can inject our controller manually as the next()
          console.log("res.body", req.body);
          console.log("req.file", req.files)
          if (!req.files) return res.json({ error: "invalid" })
          next()
        });
      }], FileController.binding().addFile);
      route.post("/delete", "xhr.file.delete", [upload.any()], FileController.binding().removeFile);
      route.post("/move", "xhr.file.move", [function (req, res, next) {
        let _middleware = upload.any()
        console.log(req.body);
        _middleware(req, res, () => {
          next();
        })
      }], FileController.binding().moveFile)
    });
    self.use('/xhr/sql', [], function (route: BaseRouteInterface) {
      route.get("/select-one", "xhr.sql.getOne", [], SqlQueryController.binding().selectOne);
      route.get("/select", "xhr.sql.get", [], SqlQueryController.binding().select);
      route.post("/insert", "xhr.sql.insert", [], SqlQueryController.binding().insert);
      route.post("/update", "xhr.sql.update", [], SqlQueryController.binding().update);
      route.post("/delete", "xhr.sql.delete", [], SqlQueryController.binding().delete);
    });
    self.use('/xhr/queue', [], function (route: BaseRouteInterface) {
      route.post("/delete-item", "xhr.queue.delete_item", [upload.any()], QueueController.binding().deleteQueueItem);
      route.post("/create-item", "xhr.queue.create_item", [upload.any()], QueueController.binding().createQueueItem);
      route.post("/create", "xhr.queue.create", [upload.any()], QueueController.binding().createQueue);
      route.post("/update", "xhr.queue.update", [upload.any()], QueueController.binding().updateQueue);
      route.post("/delete", "xhr.queue.delete", [upload.any()], QueueController.binding().deleteQueue);
      route.get("/queues", "xhr.queue.queues", [], QueueController.binding().getQueues);
      route.get("/:id/view", "xhr.queue.queue", [], QueueController.binding().getQueue);
    });
    self.use('/xhr/queue-record', [], function (route: BaseRouteInterface) {
      route.get("/queue-records", "xhr.queue_record.queue_records", [], QueueRecordController.binding().getQueueRecords);
      route.get("/:id/view", "xhr.queue_record.queue_record", [], QueueRecordController.binding().getQueueRecord);
    });
    self.use('/xhr/queue-record-detail', [], function (route: BaseRouteInterface) {
      route.get("/queue-record-details", "xhr.queue_record_detail.queue_record_details", [], QueueRecordDetailController.binding().getQueueRecordDetails);
      route.get("/:id/view", "xhr.queue_record_detail.queue_record_detail", [], QueueRecordDetailController.binding().getQueueRecordDetail);
      route.get("/:id/display-process", "xhr.queue_record_detail.display_process", [], QueueRecordDetailController.binding().getDisplayProcess);
    });
    self.use('/xhr/auth', [], function (route: BaseRouteInterface) {
      route.post("/login", "xhr.auth.login", [upload.any()], AuthController.binding().login);
      route.post("/forgot-password", "xhr.auth.forgot-password", [upload.any()], AuthController.binding().forgotPassword);
      route.post("/register", "xhr.auth.register", [upload.any()], AuthController.binding().register);
      route.post("/logout", "xhr.auth.logout", [], AuthController.binding().logout);
      route.get("/user", "xhr.auth.user", [], AuthController.binding().getAuth);
    })
    self.use("/xhr/user", [DashboardAuth], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.user.add", [upload.any()], UserController.binding().addUser);
      route.post("/update", "xhr.user.update", [upload.any()], UserController.binding().updateUser);
      route.post("/update/self", "xhr.user.update_current", [upload.any()], UserController.binding().updateCurrentUser);
      route.post("/delete", "xhr.user.delete", [upload.any()], UserController.binding().deleteUser);
      route.get("/users", "xhr.user.users", [], UserController.binding().getUsers);
      route.get("/:id/view", "xhr.user.user", [], UserController.binding().getUser);
    });
    self.use("/xhr/group", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.group.add", [], GroupController.binding().addGroup);
      route.post("/update", "xhr.group.update", [], GroupController.binding().updateGroup);
      route.post("/delete", "xhr.group.delete", [], GroupController.binding().deleteGroup);
      route.get("/groups", "xhr.group.groups", [], GroupController.binding().getGroups);
      route.get("/:id", "xhr.group.group", [], GroupController.binding().getGroup);
    });
    self.use("/xhr/group-user", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.group_user.add", [], GroupUserController.binding().addGroupUser);
      route.post("/update", "xhr.group_user.update", [], GroupUserController.binding().updateGroupUser);
      route.post("/delete", "xhr.group_user.delete", [], GroupUserController.binding().deleteGroupUser);
      route.get("/group-users", "xhr.group_user.group_users", [], GroupUserController.binding().getGroupUsers);
      route.get("/:id", "xhr.group_user.group_user", [], GroupUserController.binding().getGroupUser);
    });
    self.use("/xhr/project", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.project.add", [], ProjectController.binding().addProject);
      route.post("/update", "xhr.project.update", [], ProjectController.binding().updateProject);
      route.post("/delete", "xhr.project.delete", [], ProjectController.binding().deleteProject);
      route.get("/projects", "xhr.project.projects", [], ProjectController.binding().getProjects);
      route.get("/:id", "xhr.project.project", [], ProjectController.binding().getProject);
    });
    self.use("/xhr/pipeline", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.pipeline.add", [], PipelineController.binding().addPipeline);
      route.post("/update", "xhr.pipeline.update", [], PipelineController.binding().updatePipeline);
      route.post("/delete", "xhr.pipeline.delete", [], PipelineController.binding().deletePipeline);
      route.get("/pipelines", "xhr.pipeline.pipelines", [], PipelineController.binding().getPipelines);
      route.get("/:id", "xhr.pipeline.pipeline", [], PipelineController.binding().getPipeline);
    });
    self.use("/xhr/pipeline-item", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.pipeline_item.add", [], PipelineItemController.binding().addPipelineItem);
      route.post("/update", "xhr.pipeline_item.update", [], PipelineItemController.binding().updatePipline);
      route.post("/delete", "xhr.pipeline_item.delete", [], PipelineItemController.binding().deletePipeline);
      route.get("/pipeline-items", "xhr.pipeline_item.pipeline_items", [], PipelineItemController.binding().getPipelines);
      route.get("/:id", "xhr.pipeline_item.pipeline_item", [], PipelineItemController.binding().getPipeline);
    });
    self.use("/xhr/configuration", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.configuration.add", [], ConfigurationController.binding().addConfiguration);
      route.post("/update", "xhr.configuration.update", [], ConfigurationController.binding().updateConfiguration);
      route.post("/delete", "xhr.configuration.delete", [], ConfigurationController.binding().deleteConfiguration);
      route.get("/configurations", "xhr.configuration.configurations", [], ConfigurationController.binding().getConfigurations);
      route.get("/:id", "xhr.configuration.configuration", [], ConfigurationController.binding().getConfiguration);
    });
    self.use("/xhr/execution", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.execution.add", [], ExecutionController.binding().addExecution);
      route.post("/update", "xhr.execution.update", [], ExecutionController.binding().updateExecution);
      route.post("/delete", "xhr.execution.delete", [], ExecutionController.binding().deleteExecution);
      route.get("/executions", "xhr.execution.executions", [], ExecutionController.binding().getExecutions);
      route.get("/:id", "xhr.execution.execution", [], ExecutionController.binding().getExecution);
    });
  }
});