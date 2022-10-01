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
import OutSideAuth from "@root/app/middlewares/OutSideAuth";
import OAuthUserController from "@root/app/controllers/xhr/OAuthUserController";
import CredentialController from "@root/app/controllers/xhr/CredentialController";
import VariableItemController from "@root/app/controllers/xhr/VariableItemController";
import File2Controller from "@root/app/controllers/xhr/File2Controller";
import { FlydriveStorageEngine, MulterFlydriveOptionsFunction } from 'multer-flydrive-engine';
import { StorageManager } from "@slynova/flydrive";
import upath from 'upath';
import PagePublisherController from "@root/app/controllers/xhr/PagePublisherController";
import PagePublisherUserController from "@root/app/controllers/xhr/PagePublisherUserController";
import PagePublisherAuth from "@root/app/middlewares/PagePublisherAuth";
import GenerateSessionIdentity from "@root/app/middlewares/GenerateSessionIdentity";
import TokenDataGuestAuth from "@root/app/middlewares/TokenDataGuestAuth";

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

const basicUpload = multer();
const upload = multer({
  storage: storageTemp
});

declare let storage: StorageManager;

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
  baseRoute: '',
  onready() {
    let self = this;
    self.use('/', [GenerateSessionIdentity], function (route: BaseRouteInterface) {
      route.get('', 'front.index', [], HomeController.binding().displayIndex);
      route.get("/dashboard/login-page-publisher", "front.dashboard.login_page_publisher", [], DashboardController.binding().displayView);
      route.get("/dashboard/login", "front.dashboard.login", [], DashboardController.binding().displayView);
      route.get("/dashboard/register", "front.dashboard.register", [], DashboardController.binding().displayView);
      route.get("/dashboard/login/oauth2/code*", "front.dashboard.oauth_redirect", [DashboardAuth], DashboardController.binding().oauthRedirect)
      route.get("/dashboard/queue-record/job", "front.dashboard.queue_record.job.display_result", [TokenDataGuestAuth/* PagePublisherAuth */], DashboardController.binding().displayView);
      route.get("/dashboard*", "front.dashboard", [DashboardAuth], DashboardController.binding().displayView);
      route.get("/ws", "ws", [], WSocketController.binding().connect);
      route.get("/route", "display.route", [], route.displayRoute.bind(self));
    });

    // For client only
    // self.use("/client", [OutSideAuth], function (route: BaseRouteInterface) {
    //   // Queue
    //   route.post("/queue/add", "client.queue.add", [upload.any()], OutSideController.binding().createQueue);
    //   route.post("/queue/item/result/add", "client.result.add", [upload.any()], OutSideController.binding().addResultQueueDetailData);
    //   route.get("/queue/:queue_key/stop", "client.queue.stop", [], OutSideController.binding().deleteQueue);
    //   route.get("/queue/:job_id", "client.queue.queue", [], OutSideController.binding().deleteQueue);

    // });

    // For short token after generate queue
    // self.use("/guest", [/* shortTokenAuth */], function (route: BaseRouteInterface) {
    //   route.get("/queue/:job_id/stop", "guest.queue.stop", [], OutSideController.binding().deleteQueue);
    //   route.get("/queue/item/display/:queue_key/process", "guest.queue_display_process", [], OutSideController.binding().queueDisplayProcess);
    //   // Ws
    //   route.get("/ws", "guest.ws", [], WSocketController.binding().connect);
    // })

    // Will deprecated
    self.use('/xhr/file', [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.file.add", [function (req, res, next) {
        console.log("before-multer-res.body", req.body);
        console.log("before-multer-req.file", req.file)
        // console.log("before-multer-req.body_file", req.body.files)
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

    self.use("/xhr/file2", [DashboardAuth], function (route: BaseRouteInterface) {
      route.post("/put", "xhr.file2.put", [function (req, res, next) {
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
      route.post("/mkdir", "xhr.file2.mkdir", [upload.any()], File2Controller.binding().addDir);
      route.post("/delete", "xhr.file2.delete", [upload.any()], File2Controller.binding().remove);
      route.post('/delete-by-ids', 'xhr.file2.delete_by_ids', [upload.any()], File2Controller.binding().removeByIds);
      route.post("/move", "xhr.file2.move", [upload.any()], File2Controller.binding().move)
      route.post("/copy", "xhr.file2.copy", [upload.any()], File2Controller.binding().copy)
      route.post("/duplicate", "xhr.file2.duplicate", [upload.any()], File2Controller.binding().duplicated)
      route.post("/rename", "xhr.file2.rename", [upload.any()], File2Controller.binding().rename)
      route.get("/files", "xhr.file2.files", [], File2Controller.binding().getFiles);
      route.get("/:id/view", "xhr.file2.file", [], File2Controller.binding().getFile);
      route.get("/display/:id", "xhr.file2.display", [], File2Controller.binding().display);
    });

    self.use("/xhr/configuration", [], function (route: BaseRouteInterface) {
      route.get("/", "xhr.configuration.configuration", [], ConfigurationController.binding().getConfiguration);
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
      route.post("/create/:queue_key", "xhr.queue.create_by_queue_key", [upload.any()], OutSideController.binding().createQueue);
      route.post("/create", "xhr.queue.create", [upload.any()], QueueController.binding().createQueue);
      route.post("/update", "xhr.queue.update", [upload.any()], QueueController.binding().updateQueue);
      route.post("/delete", "xhr.queue.delete", [upload.any()], QueueController.binding().deleteQueue);
      route.post("/stop-worker", "xhr.queue.stop_worker", [upload.any()], QueueController.binding().stopWorker);
      route.post("/delete-scheduler", "xhr.queue.delete_scheduler", [upload.any()], QueueController.binding().deleteQueueScheduler);
      route.get("/queues", "xhr.queue.queues", [], QueueController.binding().getQueues);
      route.get("/:id/view", "xhr.queue.queue", [], QueueController.binding().getQueue);
    });

    self.use('/xhr/queue-group', [], function (route: BaseRouteInterface) {
      route.post("/create", "xhr.queue_group.create", [upload.any()], QueueController.binding().createQueueGroup);
    });

    self.use('/xhr/queue-record', [DashboardAuth], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.queue_record.add", [upload.any()], QueueRecordController.binding().addQueueRecord);
      route.post("/update", "xhr.queue_record.update", [upload.any()], QueueRecordController.binding().updateQueueRecord);
      route.post("/delete", "xhr.queue_record.delete", [upload.any()], QueueRecordController.binding().deleteQueueRecord);
      route.get("/queue-records", "xhr.queue_record.queue_records", [], QueueRecordController.binding().getQueueRecords);
      route.get("/ids/status", "xhr.queue_record.ids.status", [], QueueRecordController.binding().getQueueIdsstatus);
      route.get("/:id/view", "xhr.queue_record.queue_record", [], QueueRecordController.binding().getQueueRecord);
    });

    self.use('/xhr/queue-record-detail', [], function (route: BaseRouteInterface) {
      route.get("/display-data/file", "xhr.queue_record_detail.file", [TokenDataGuestAuth], QueueRecordDetailController.binding().getFile);
      route.get("/display-data/directories", "xhr.queue_record_detail.directories", [TokenDataGuestAuth], QueueRecordDetailController.binding().getDirectories);
    });

    self.use('/xhr/queue-record-detail', [DashboardAuth], function (route: BaseRouteInterface) {
      route.get("/queue-record-details", "xhr.queue_record_detail.queue_record_details", [], QueueRecordDetailController.binding().getQueueRecordDetails);
      route.get("/ids/status", "xhr.queue_record_detail.ids.status", [], QueueRecordDetailController.binding().getIdsStatus);
      route.get("/:id/view", "xhr.queue_record_detail.queue_record_detail", [], QueueRecordDetailController.binding().getQueueRecordDetail);
      route.get("/:id/display-process", "xhr.queue_record_detail.display_process", [], QueueRecordDetailController.binding().getDisplayProcess);
      route.post("/deletes", "xhr.queue_record_detail.deletes", [upload.any()], QueueRecordDetailController.binding().deleteQueueRecordDetails);
      route.post("/generate-url-display", "xhr.queue_record_detail.generate_url_display", [upload.any()], QueueRecordDetailController.binding().generateUrlDisplay)
    });

    self.use('/xhr/queue-record-schedule', [DashboardAuth], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.queue_record_schedule.add", [upload.any()], QueueRecordScheduleController.binding().addQueueRecordSchedule);
      route.post("/update", "xhr.queue_record_schedule.update", [upload.any()], QueueRecordScheduleController.binding().updateQueueRecordSchedule);
      route.post("/delete", "xhr.queue_record_schedule.delete", [upload.any()], QueueRecordScheduleController.binding().deleteQueueRecordSchedule);
      route.get("/queue-record-schedules", "xhr.queue_record_schedule.queue_record_schedules", [], QueueRecordScheduleController.binding().getQueueRecordSchedules);
      route.get("/:id/view", "xhr.queue_record_schedule.queue_record_schedule", [], QueueRecordScheduleController.binding().getQueueRecordSchedule);
    });

    self.use('/xhr/auth', [], function (route: BaseRouteInterface) {
      route.post("/request-pin", "xhr.auth.request_pin", [upload.any()], AuthController.binding().requestPin);
      route.post('/login/oauth/generate', 'xhr.auth.login.oauth.generate', [upload.any()], AuthController.binding().oAuthGenerate);
      route.post("/login-page-publisher", "xhr.auth.login_page_publisher", [upload.any()], AuthController.binding().loginPagePublisher);
      route.post("/login", "xhr.auth.login", [upload.any()], AuthController.binding().login);
      route.post("/forgot-password", "xhr.auth.forgot-password", [upload.any()], AuthController.binding().forgotPassword);
      route.post("/register", "xhr.auth.register", [upload.any()], AuthController.binding().register);
      route.post("/logout", "xhr.auth.logout", [], AuthController.binding().logout);
      route.get("/user", "xhr.auth.user", [], AuthController.binding().getAuth);
      route.get("/register-expired-check", 'xhr.auth.register_expired_check', [], AuthController.binding().registerExpiredCheck);
    })

    self.use('/xhr/oauth-user', [DashboardAuth], function (route: BaseRouteInterface) {
      route.get('/oauth-users', 'xhr.oauth-user.oauth-users', [], OAuthUserController.binding().getOAuthUsers);
      route.get('/:id/view', 'xhr.oauth-user.oauth-user', [], OAuthUserController.binding().getOAuthUser);
      route.post('/add', 'xhr.oauth-user.add', [upload.any()], OAuthUserController.binding().addOAuthUser);
      route.post('/update', 'xhr.oauth-user.update', [upload.any()], OAuthUserController.binding().updateOAuthUser);
      route.post('/delete', 'xhr.oauth-user.delete', [upload.any()], OAuthUserController.binding().deleteOAuthUsers);
    })

    self.use("/xhr/user", [DashboardAuth], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.user.add", [upload.any()], UserController.binding().addUser);
      route.post("/update", "xhr.user.update", [upload.any()], UserController.binding().updateUser);
      route.post("/update/self", "xhr.user.update_current", [upload.any()], UserController.binding().updateCurrentUser);
      route.post("/delete", "xhr.user.delete", [upload.any()], UserController.binding().deleteUser);
      route.get("/self", "xhr.user.self", [], UserController.binding().getSelfUser);
      route.get("/users", "xhr.user.users", [], UserController.binding().getUsers);
      route.get("/:id/view", "xhr.user.user", [], UserController.binding().getUser);
    });

    self.use("/xhr/group", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.group.add", [upload.any()], GroupController.binding().addGroup);
      route.post("/update", "xhr.group.update", [upload.any()], GroupController.binding().updateGroup);
      route.post("/delete", "xhr.group.delete", [upload.any()], GroupController.binding().deleteGroup);
      route.get("/groups", "xhr.group.groups", [], GroupController.binding().getGroups);
      route.get("/:id", "xhr.group.group", [], GroupController.binding().getGroup);
    });

    self.use("/xhr/group-user", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.group_user.add", [upload.any()], GroupUserController.binding().addGroupUser);
      route.post("/update", "xhr.group_user.update", [upload.any()], GroupUserController.binding().updateGroupUser);
      route.post("/delete", "xhr.group_user.delete", [upload.any()], GroupUserController.binding().deleteGroupUser);
      route.get("/group-users", "xhr.group_user.group_users", [], GroupUserController.binding().getGroupUsers);
      route.get("/:id", "xhr.group_user.group_user", [], GroupUserController.binding().getGroupUser);
    });
    self.use("/xhr/project", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.project.add", [upload.any()], ProjectController.binding().addProject);
      route.post("/update", "xhr.project.update", [upload.any()], ProjectController.binding().updateProject);
      route.post("/delete", "xhr.project.delete", [upload.any()], ProjectController.binding().deleteProject);
      route.get("/projects", "xhr.project.projects", [], ProjectController.binding().getProjects);
      route.get("/:id/view", "xhr.project.project", [], ProjectController.binding().getProject);
    });

    self.use("/xhr/pipeline", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.pipeline.add", [upload.any()], PipelineController.binding().addPipeline);
      route.post("/update", "xhr.pipeline.update", [upload.any()], PipelineController.binding().updatePipeline);
      route.post("/delete", "xhr.pipeline.delete", [upload.any()], PipelineController.binding().deletePipeline);
      route.get("/pipelines", "xhr.pipeline.pipelines", [], PipelineController.binding().getPipelines);
      route.get("/:id/view", "xhr.pipeline.pipeline", [], PipelineController.binding().getPipeline);
    });

    self.use("/xhr/pipeline-item", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.pipeline_item.add", [upload.any()], PipelineItemController.binding().addPipelineItem);
      route.post("/update", "xhr.pipeline_item.update", [upload.any()], PipelineItemController.binding().updatePipline);
      route.post("/delete", "xhr.pipeline_item.delete", [upload.any()], PipelineItemController.binding().deletePipeline);
      route.get("/pipeline-items", "xhr.pipeline_item.pipeline_items", [], PipelineItemController.binding().getPipelines);
      route.get("/:id/view", "xhr.pipeline_item.pipeline_item", [], PipelineItemController.binding().getPipeline);
    });

    self.use("/xhr/pipeline-task", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.pipeline_task.add", [upload.any()], PipelineTaskController.binding().addPipelineTask);
      route.post("/update", "xhr.pipeline_task.update", [upload.any()], PipelineTaskController.binding().updatePipelineTask);
      route.post("/delete", "xhr.pipeline_task.delete", [upload.any()], PipelineTaskController.binding().deletePipelineTask);
      route.post("/delete-by-pipeline", "xhr.pipeline_task.delete_by_pipeline", [upload.any()], PipelineTaskController.binding().deletePipelineTaskByPipelineItemId);
      route.get("/pipeline-tasks", "xhr.pipeline_task.pipeline_tasks", [], PipelineTaskController.binding().getPipelineTasks);
      route.get("/:id/view", "xhr.pipeline_item.pipeline_task", [], PipelineTaskController.binding().getPipelineTask);
    });

    self.use("/xhr/host", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.host.add", [upload.any()], HostController.binding().addHost);
      route.post("/update", "xhr.host.update", [upload.any()], HostController.binding().updateHost);
      route.post("/delete", "xhr.host.delete", [upload.any()], HostController.binding().deleteHosts);
      route.get("/hosts", "xhr.host.hosts", [], HostController.binding().getHosts);
      route.get("/:id/view", "xhr.host.host", [], HostController.binding().getHost);
    });

    self.use("/xhr/execution", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.execution.add", [upload.any()], ExecutionController.binding().addExecution);
      route.post("/update", "xhr.execution.update", [upload.any()], ExecutionController.binding().updateExecution);
      route.post("/delete", "xhr.execution.delete", [upload.any()], ExecutionController.binding().deleteExecution);
      route.get("/executions", "xhr.execution.executions", [], ExecutionController.binding().getExecutions);
      route.get("/:id/view", "xhr.execution.execution", [], ExecutionController.binding().getExecution);
    });

    self.use("/xhr/variable", [], function (route: BaseRouteInterface) {
      route.post("/add", "xhr.variable.add", [upload.any()], VariableController.binding().addVariable);
      route.post("/update", "xhr.variable.update", [upload.any()], VariableController.binding().updateVariable);
      route.post("/delete", "xhr.variable.delete", [upload.any()], VariableController.binding().deleteVariable);
      route.get("/variables", "xhr.variable.variables", [], VariableController.binding().getVariables);
      route.get("/:id/view", "xhr.variable.variable", [], VariableController.binding().getVariable);
    });

    self.use("/xhr/variable-item", [], function (route: BaseRouteInterface) {
      route.post("/render", "xhr.variable_item.render", [upload.any()], VariableItemController.binding().renderVarScheme);
      route.post("/add", "xhr.variable_item.add", [upload.any()], VariableItemController.binding().addVariableItem);
      route.post("/update", "xhr.variable_item.update", [upload.any()], VariableItemController.binding().updateVariableItem);
      route.post("/delete", "xhr.variable_item.delete", [upload.any()], VariableItemController.binding().deleteVariableItem);
      route.get("/variable-items", "xhr.variable_item.variable_items", [], VariableItemController.binding().getVariableItems);
      route.get("/:id/view", "xhr.variable_item.variable", [], VariableItemController.binding().getVariableItem);
    });

    self.use("/xhr/repository", [DashboardAuth, GithubAuth], function (route: BaseRouteInterface) {
      route.get("/repositories", "xhr.repository.repositories", [], RepositoryController.binding().getRepositories);
      route.get("/owner", "xhr.repository.owner", [], RepositoryController.binding().getOwner);
      route.get("/branch/branchs", "xhr.repository.branch.branchs", [], RepositoryController.binding().getBranchRepository);
      route.get("/commit/commits", "xhr.repository.commit.commits", [], RepositoryController.binding().getCommits);
      route.get("/:repo_name/view", "xhr.repository.repository", [], RepositoryController.binding().getRepository);
      route.post("/select", "xhr.repository.select", [upload.any()], RepositoryController.binding().selectRepository);
    })

    self.use("/xhr/webhook", [], function (route: BaseRouteInterface) {
      route.get("/webhooks", "xhr.webhook.webhooks", [DashboardAuth], WebHookController.binding().getWebHooks);
      route.get("/:id/view", "xhr.webhook.webhook", [DashboardAuth], WebHookController.binding().getWebHook);
      route.get("/:webhook_id/histories", "xhr.webhook.webhook.histories", [DashboardAuth], WebHookController.binding().getHistories);
      route.post("/add", "xhr.webhook.add", [upload.any(), DashboardAuth], WebHookController.binding().addWebHook);
      route.post("/update", "xhr.webhook.update", [upload.any(), DashboardAuth], WebHookController.binding().updateWebHook);
      route.post("/delete", "xhr.webhook.delete", [upload.any(), DashboardAuth], WebHookController.binding().deleteWebHook);
      route.post("/execute/test-item", "xhr.webhook.execute.test_item", [upload.any(), DashboardAuth], WebHookController.binding().executeTestItem)
      route.post("/execute", "xhr.webhook.execute", [upload.any(), WebhookAuth], WebHookController.binding().execute);
    })

    self.use("/xhr/personal-token", [], function (route: BaseRouteInterface) {
      route.get("/", "xhr.personal_access_token.personal_access_tokens", [DashboardAuth], PersonalAccessTokenController.binding().getPersonalAccessTokens);
      route.get("/:id/view", "xhr.personal_access_token.personal_access_token", [DashboardAuth], PersonalAccessTokenController.binding().getPersonalAccessToken);
      route.post("/add", "xhr.personal_access_token.new", [upload.any(), DashboardAuth], PersonalAccessTokenController.binding().addPersonalAccessToken);
      route.post("/update", "xhr.personal_access_token.update", [upload.any(), DashboardAuth], PersonalAccessTokenController.binding().updatePersonalAccessToken);
      route.post("/delete", "xhr.personal_access_token.delete", [upload.any(), DashboardAuth], PersonalAccessTokenController.binding().deletePersonalAccessToken);
    })

    self.use("/xhr/credential", [], function (route: BaseRouteInterface) {
      route.get("/", "xhr.credential.credentials", [DashboardAuth], CredentialController.binding().getCredentials);
      route.get("/:id/view", "xhr.credential.credential", [DashboardAuth], CredentialController.binding().getCredential);
      route.post("/add", "xhr.credential.new", [upload.any(), DashboardAuth], CredentialController.binding().addCredential);
      route.post("/update", "xhr.credential.update", [upload.any(), DashboardAuth], CredentialController.binding().updateCredential);
      route.post("/delete", "xhr.credential.delete", [upload.any(), DashboardAuth], CredentialController.binding().deleteCredential);
    })

    self.use("/xhr/page-publisher", [], function (route: BaseRouteInterface) {
      route.get("/", "xhr.page_publisher.page_publishers", [DashboardAuth], PagePublisherController.binding().gets);
      route.get("/:page_name/:table_id/view", "xhr.page_publisher.page_publisher_page_name_table_id", [DashboardAuth], PagePublisherController.binding().getByPageNameTableId);
      route.get("/:id/view", "xhr.page_publisher.page_publisher", [DashboardAuth], PagePublisherController.binding().get);
      route.post("/add", "xhr.page_publisher.add", [upload.any(), DashboardAuth], PagePublisherController.binding().add);
      route.post("/update", "xhr.page_publisher.update", [upload.any(), DashboardAuth], PagePublisherController.binding().update);
      route.post("/deletes", "xhr.page_publisher.deletes", [upload.any(), DashboardAuth], PagePublisherController.binding().deletes);
    })

    self.use("/xhr/page-publisher-user", [], function (route: BaseRouteInterface) {
      route.get("/", "xhr.page_publisher_user.page_publisher_users", [DashboardAuth], PagePublisherUserController.binding().gets);
      route.get("/:id/view", "xhr.page_publisher_user.page_publisher_user", [DashboardAuth], PagePublisherUserController.binding().get);
      route.post("/add", "xhr.page_publisher_user.add", [upload.any(), DashboardAuth], PagePublisherUserController.binding().add);
      route.post("/update", "xhr.page_publisher_user.update", [upload.any(), DashboardAuth], PagePublisherUserController.binding().update);
      route.post("/deletes", "xhr.page_publisher_user.deletes", [upload.any(), DashboardAuth], PagePublisherUserController.binding().deletes);
    })
  }
});