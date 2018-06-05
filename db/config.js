module.exports = {
  development: {
    username: 'postgres',
    password: null,
    database: 'postgres',
    host: '127.0.0.1',
    logging: false,
    dialect: 'postgres',
  },
  test: {
    username: 'postgres',
    password: null,
    database: 'database_test',
    host: '127.0.0.1',
    dialect: 'postgres',
    logging: false,
    //   "logging": (sql)=>console.log(sql.replace(/,/g,`\r\n`))
  },
  production: {
    username: 'postgres',
    password: null,
    database: 'database_production',
    host: '127.0.0.1',
    dialect: 'postgres',
  },
};
