require('dotenv').config();

const environment = process.env.NODE_ENV || 'development';

const config = {
    development: {
        HOST: process.env.DB_HOST || "localhost",
        PORT: process.env.DB_PORT || 27017,
        DB: process.env.DB_NAME || "nearstdoc_db"
    },
    production: {
        HOST: process.env.DB_HOST || "production-db-host",
        PORT: process.env.DB_PORT || 27017,
        DB: process.env.DB_NAME || "production_db_name"
    }
};

module.exports = config[environment];
