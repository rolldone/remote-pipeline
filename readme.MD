# Remote Pipeline
Is to help ssh remote pipline to the server

## Setup project
For first create your working directory first, we call **remote-pipeline**. Then pull this repository.

> Note : \
Before you continue setup this repository you need setup [remote-pipeline-dashboard](https://github.com/rolldone/remote-pipeline-dashboard) first.


After you pull this repo. Create docker volume first
```
docker volume create remote_pipeline_data && docker volume create remote_pipeline_database
```
Then create docker-compose.yaml
### docker-compose.yaml
```
services:
  phpliteadmin:
    image: vtacquet/phpliteadmin
    volumes:
      - "remote_pipeline_database:/db"
    ports:
      - "3001:80"
    environment:
      - TZ=Asia/Makassar
      #- PASSWORD=something
      - LOCATION=/db
  app:
    container_name: remote_pipline
    build: ./image_node
    working_dir: '/opt/app'
    expose:
      - "8084"
    command: >
      bash -c  "
        nodemon dist/app.js -e css,js,html,nj --ignore 'sessions/*' --ignore 'storage/*' --ignore 'dashboard/dist/*' || true && tail -f > /dev/null
      "
    volumes:
      - "remote_pipeline_data:/opt/app"
      - "remote_pipeline_dashboard:/opt/app/dashboard"
      - "remote_pipeline_database:/opt/app/db"
    ports:
      - "3000:8084"
    labels:
      generated: by 8gwifi.org
    links:
      - redis
  redis:
    image: redis:latest
    ports:
      - "8085:6379"
    command: redis-server --requirepass 43lw9rj2
    expose:
      - 6379
    deploy:
      resources:
        limits:
          cpus: "2"
          memory: 256M
version: '3'
volumes:
  remote_pipeline_data: # this main app
    external: true
  remote_pipeline_dashboard: # this remote-pipeline-dashboard
    external: true
  remote_pipeline_database: # this database
    external: true

```
If you use ngi-sync as working tool, this is configuration for you.

```
ngi-sync init
```

Change the default config to with this 
## .sync_ignore
```
.sync_collections
.sync_ignore
sync-config.yaml
sync-config.yml
.sync_temp
node_modules
**/node_modules
vendor
**/vendor
.git
ngi-sync-*

./my.log
!/node_modules/sql-bricks
/command.log
```


## sync-config.yaml
```
reset_cache: true
project_name: Remote Pipeline
username: root
privateKey: /home/donny/.ssh/openssh_nopassword # your private key
host: 192.168.50.4 # your target host
port: 2200 # your target port
localPath: .
remotePath: /root/workspaces/remote-pipeline # your remote working dir
devsync:
  os_target: linux
  ignores: []
  downloads:
    - /.env
    - /package.json
    - /package-lock.json
    - /migrations/
    - /storage/
    - /dist
  single_sync:
    - node_modules
    - migrations
    - storage
  script:
    local:
      on_ready:
      on_stop:
      commands:
        - npm install && npm run dev
    remote:
      on_ready:
      on_stop:
      commands:
        - docker-compose up --build
        - docker-compose up >>> my.log
        - docker-compose exec app bash -l
        - docker-compose exec phpliteadmin sh
  trigger_permission:
    unlink_folder: true
    unlink: true
    change: true
    add: true
direct_access:
  config_file: ""
  ssh_configs:
    - Host: remote_pipeline
      HostName: =host
      User: =username
      Port: =port
      RequestTty: force
      IdentityFile: =privateKey
      StrictHostKeyChecking: no
      RemoteCommand: cd =remotePath && bash -l
      ServerAliveInterval: 300
      ServerAliveCountMax: 2
  ssh_commands:
    - access_name: Enter Server
      command: ssh -v remote_pipeline


```


