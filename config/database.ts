// ──────────────────────────────────────────────────────────────
// HyperZ Config — Database
// ──────────────────────────────────────────────────────────────

import { env, envNumber, envBool } from '../src/support/helpers.js';

export default {
    // Default SQL driver: sqlite, mysql, postgresql
    driver: env('DB_DRIVER', 'sqlite'),

    connections: {
        sqlite: {
            client: 'sqlite3',
            connection: {
                filename: './database/database.sqlite',
            },
            useNullAsDefault: true,
        },
        mysql: {
            client: 'mysql2',
            connection: {
                host: env('DB_HOST', '127.0.0.1'),
                port: envNumber('DB_PORT', 3306),
                user: env('DB_USER', 'root'),
                password: env('DB_PASSWORD', ''),
                database: env('DB_NAME', 'hyperz'),
            },
        },
        postgresql: {
            client: 'pg',
            connection: {
                host: env('DB_HOST', '127.0.0.1'),
                port: envNumber('DB_PORT', 5432),
                user: env('DB_USER', 'root'),
                password: env('DB_PASSWORD', ''),
                database: env('DB_NAME', 'hyperz'),
            },
        },
    },

    // MongoDB (Mongoose)
    mongodb: {
        enabled: envBool('MONGO_ENABLED', false),
        uri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/hyperz'),
    },

    // Migrations
    migrations: {
        directory: './database/migrations',
        tableName: 'hyperz_migrations',
    },

    // Seeders
    seeds: {
        directory: './database/seeders',
    },

    // TypeORM specific
    typeorm: {
        entities: ['app/models/**/*.ts', 'src/models/**/*.ts'],
        migrations: ['database/migrations/typeorm/**/*.ts'],
        subscribers: ['app/subscribers/**/*.ts'],
        synchronize: envBool('DB_SYNC', false),
        logging: envBool('DB_LOGGING', false),
    },
};
