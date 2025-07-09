require('dotenv').config();

module.exports = {
  development: {
    username: process.env.PG_USER || 'root',
    password: process.env.PG_PASSWORD || 'password',
    database: process.env.PG_DATABASE || 'dula_dev',
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    dialect: 'mysql',
  },
  test: {
    username: process.env.PG_USER || 'root',
    password: process.env.PG_PASSWORD || 'password',
    database: process.env.PG_DATABASE || 'dula_test',
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    dialect: 'mysql',
  },
  production: {
    username: process.env.PG_USER || 'root',
    password: process.env.PG_PASSWORD || 'password',
    database: process.env.PG_DATABASE || 'dula_prod',
    host: process.env.PG_HOST || 'localhost',
    port: Number(process.env.PG_PORT) || 5432,
    dialect: 'mysql',
  },
};
