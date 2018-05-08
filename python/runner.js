const demand = require('../lib/demand');

const minio = require('../server-lib/minio');

async function PostJobRun({ 
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






module.exports = { PostJobRun };
