import "reflect-metadata";
import { DataSource } from "typeorm";
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

let AppDataSource: DataSource | null = null;

export const initializeDataSource = async () => {
    if (AppDataSource) {
        if (!AppDataSource.isInitialized) await AppDataSource.initialize();
        return AppDataSource;
    }

    // Dynamic import to ensure we get the latest config after dotenv is loaded
    const { default: databaseConfig } = await import("../../config/database.js");

    const driver = (databaseConfig as any).driver;
    const connConfig = (databaseConfig as any).connections?.[driver];

    AppDataSource = new DataSource({
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

    await AppDataSource.initialize();
    return AppDataSource;
};

// Export for potential CLI usage, but it will be null until initialized
export { AppDataSource };
