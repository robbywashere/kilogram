module.exports = {
  "development": {
    "username": "postgres",
    "password": null,
    "database": "postgres",
    "host": "127.0.0.1",
    //"logging": console.log,
    "logging": false,
    "dialect": "postgres",
  },
  "test": {
    "username": "postgres",
    "password": null,
    "database": "database_test",
    "host": "127.0.0.1",
    "dialect": "postgres",
    "logging": false 
  },
  "production": {
    "username": "postgres",
    "password": null,
    "database": "database_production",
    "host": "127.0.0.1",
    "dialect": "postgres",
  }
}
