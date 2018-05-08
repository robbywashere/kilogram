
//Turns oustanding posts into Jobs
exports.InitPostJobQuery = `
  INSERT INTO
    "PostJobs"
    ("PostId", "IGAccountId", "AccountId", "createdAt", "updatedAt") (
      SELECT 
        "Posts"."id",
        "Posts"."IGAccountId",
        "Posts"."AccountId",
        NOW() "createdAt",
        NOW() "updatedAt"
      FROM
        "Posts"
      LEFT JOIN
        "PostJobs"
      ON 
        "PostJobs"."PostId" = "Posts"."id"
      WHERE
        "Posts"."postDate" <= NOW()
      AND
        "PostJobs"."PostId" IS NULL 
    )
`


//TODO: https://blog.2ndquadrant.com/what-is-select-skip-locked-for-in-postgresql-9-5/

exports.GetJobQuery = (tableName) => `
  UPDATE 
      "${tableName}"
  SET 
      inprog=true
  WHERE
      id = (
          SELECT
              id
          FROM
              "${tableName}"
          WHERE
              inprog=false
          AND
              finish=false
          AND
              sleep=false
          ORDER BY id 
          FOR UPDATE SKIP LOCKED
          LIMIT 1
      )
  RETURNING *;
`


exports.StatsQuery = (tableName)=>`
  SELECT 
    sum(case when (finish = true) then 1 else 0 end) as completed,
    sum(case when (finish = false) AND (inprog = false) AND (sleep = false) then 1 else 0 end) as outstanding,
    sum(case when (sleep = true) AND (inprog = false) AND (finish = false) then 1 else 0 end) as sleeping,
    sum(case when (inprog = true) then 1 else 0 end) as in_progress
  from "${tableName}"
`;
