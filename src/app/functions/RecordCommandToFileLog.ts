import { appendFile, createReadStream, existsSync, mkdirSync, readFile, writeFile, writeFileSync } from "fs";
import Tail from 'tail';
import readline from 'readline';

const RecordCommandToFileLog = function (props: {
  fileName: string,
  commandString: string
}) {
  try {
    mkdirSync(process.cwd() + "/storage/app/command/log", {
      recursive: true
    })
  } catch (ex) {
    console.log("mkdirSync - ex :: ", ex);
  }
  appendFile(process.cwd() + "/storage/app/command/log/" + props.fileName + ".log", props.commandString, function (err) {
    if (err) throw err;
    // console.log('Saved!');
  });
}

export const ResetCommandToFileLog = function (fileName: string) {
  try {
    writeFileSync(process.cwd() + "/storage/app/command/log/" + fileName + ".log", '');
  } catch (ex) {
    console.log(ex);
  }
}

export const ReadRecordCOmmandFileLog = function (job_id_pipeline_item_id, callback) {
  try {
    if (existsSync(process.cwd() + "/storage/app/command/log/" + job_id_pipeline_item_id + ".log") == false) {
      writeFileSync(process.cwd() + "/storage/app/command/log/" + job_id_pipeline_item_id + ".log", "")
    }
    const file = readline.createInterface({
      input: createReadStream(process.cwd() + "/storage/app/command/log/" + job_id_pipeline_item_id + ".log"),
      output: process.stdout,
      terminal: false
    });
    file.on('line', (line) => {
      callback(line);
    });
    return file;
  } catch (ex) {
    console.log(ex);
  }
}

export const TailRecordCommandFileLog = function (job_id_pipeline_item_id) {
  // console.log("Tail :: ", Tail);
  if (existsSync(process.cwd() + "/storage/app/command/log/" + job_id_pipeline_item_id + ".log") == false) {
    writeFileSync(process.cwd() + "/storage/app/command/log/" + job_id_pipeline_item_id + ".log", "")
  }
  let tail = new Tail.Tail(process.cwd() + "/storage/app/command/log/" + job_id_pipeline_item_id + ".log");
  return tail;
}

export default RecordCommandToFileLog;