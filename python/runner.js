const demand = require('../lib/demand');

const minio = require('../server-lib/minio');

async function PostJobRun({ 
  job = demand('job'), 
  agent = demand('agent'), 
  minioClient = (new minio.MClient()) 
}) {
  const { IGAccount, Post, Photo } = job;
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

  await job.update(result);
  return result;
}


async function VerifyIGJobRun({ 
  job = demand('job'), 
  agent = demand('agent'), 
}) {
  const { IGAccount } = job;
  const result = await agent.exec({ 
    cmd: 'verify_ig_dance', 
    args: {
      username: IGAccount.username, 
      password: IGAccount.password,
    } 
  });
  await job.update(result);
  return result;
}






module.exports = { PostJobRun, VerifyIGJobRun };
