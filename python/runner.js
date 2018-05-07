const demand = require('../lib/demand');

const minio = require('../server-lib/minio');

//TODO: this is all sort of weird - the coupling of CODE and STORED DATA is extremely fragile and dumb (IQ: 76)


const COMMAND_MAP = new Map([
  ['PostJob', PostJob]
])


async function GenericJobRun({ job, agent }) {

  const { cmd } = job;
  if (typeof COMMAND_MAP === "undefined") throw new Error('WTF did you to COMMAND_MAP?its "undefined" ');
  if (!COMMAND_MAP.has(cmd)) throw new Error(`Command: '${cmd}' does not exist in COMMAND_MAP, - Job Id: ${job.id} `);

  const CMD_FN = COMMAND_MAP.get(cmd);

  if (typeof CMD_FN === "undefined") throw new Error(`Command: ${cmd} exists - but the function does not...`)

  const body = await job.getDenormalizedBody();

  return CMD_FN({ ...body, agent });

}

async function PostJob({ 
    IGAccount = demand('IGAccount'), 
    Post = demand('Post'), 
    Photo = demand('Photo'),
    agent = demand('agent'), 
    minioClient = (new minio.MClient()) 
  }){


  let localfile = await minioClient.pullPhoto({ name: Photo.objectName })

  const result = await agent.exec({ 
    cmd: 'full_dance', 
    args: {
      username: IGAccount.username, 
      password: IGAccount.password,
      desc: Post.text,
      localfile
    } 
  });

  await job.update(result); //fail fast ... TODO: possibly retry based on job??
  
  return result;

}


//TODO: Rename JobRun, to PostPhotoJob or something etc ...
async function JobRun({ 
  job = demand('job'), 
  photo = demand('photo'), 
  post = demand('post'), 
  igAccount = demand('igAccount'), 
  agent = demand('agent'), 
  minioClient = (new minio.MClient()) 
}) {
  let localfile = await minioClient.pullPhoto({ name: photo.objectName })
  const result = await agent.exec({ 
    cmd: 'full_dance', 
    args: {
      username: igAccount.username, 
      password: igAccount.password,
      desc: post.text,
      localfile
    } 
  });

  await job.update(result);
  return result;
}






module.exports = { JobRun, COMMAND_MAP };
