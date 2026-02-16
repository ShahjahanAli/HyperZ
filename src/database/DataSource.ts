import "reflect-metadata";
import { DataSource } from "typeorm";
import databaseConfig from "../../config/database.js";
import path from "node:path";

const ROOT = process.cwd();

// Helper to map DB driver to TypeORM type
const getDriverType = (driver: string): any => {
    switch (driver) {
        case 'postgresql': return 'postgres';
        case 'sqlite': return 'sqlite';
        case 'mysql': return 'mysql';
        default: return 'sqlite';
    }
};

const driver = (databaseConfig as any).driver;
const connConfig = (databaseConfig as any).connections?.[driver];

export const AppDataSource = new DataSource({
    type: getDriverType(driver),
    host: connConfig?.connection?.host,
    port: connConfig?.connection?.port,
    username: connConfig?.connection?.user,
    password: connConfig?.connection?.password,
    database: connConfig?.connection?.database || connConfig?.connection?.filename,
    synchronize: (databaseConfig as any).typeorm?.synchronize || false,
    logging: (databaseConfig as any).typeorm?.logging || false,
    entities: [path.join(ROOT, 'app/models/**/*.{ts,js}')],
    migrations: [path.join(ROOT, 'database/migrations/typeorm/**/*.{ts,js}')],
    subscribers: [],
});

export const initializeDataSource = async () => {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
    return AppDataSource;
};
