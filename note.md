## Features:
  #### Phase 1
  - Github or famous repos integration
  - Also can download zip and deploy by commit sha on execution
  - Notification script
  #### Phase 2
  - Dynamic environment value by api request
  - Connection hopping and Create tunnel for instant connection 
  - Ansible integration

\
&nbsp;

## Scenario crud:
### execution:
  - Delete execution will delete storage/executions/[execution_id]
  - Delete queue relation with this execution
### pipeline:
  - Delete pipeline will display dialog warning if have relation with pipeline_item, execution, and etc, and have two option:
    - Yes => will delete the all relation with this pipeline
    - No => just keep like that
### pipeline_item:
  - Delete pipeline will display dialog warning if have relation with pipeline_item, execution, and etc, and have two option:
    - Yes => will delete the all relation with this pipeline
    - No => just keep like that
### pipeline_task:
  - Delete pipeline will display dialog warning if have relation with pipeline_item, execution, and etc, and have two option:
    - Yes => will delete only have contain pipeline_task on execution

\
&nbsp;

# RoadMap:
## Phase 1 
- Create Webhook Module:
  ### Description:
  The user can add webhook with many push data service
  Task :
    - Create manage page to create webhook first include Script list, New Script, Update webhook
    - Create manage webhook item
    - Create manage webhook history
    - Create tester form
    \
    &nbsp;
- Create new field for store value on queue_detail for passing value between pipeline task 

