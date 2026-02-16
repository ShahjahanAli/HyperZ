import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateHyperzAdminsTable20260215170000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "hyperz_admins",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: "password",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "255",
                        isNullable: false,
                    },
                    {
                        name: "role",
                        type: "varchar",
                        length: "50",
                        isNullable: false,
                        default: "'super_admin'",
                    },
                    {
                        name: "failed_attempts",
                        type: "int",
                        isNullable: false,
                        default: 0,
                    },
                    {
                        name: "locked_until",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "last_login_at",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "last_login_ip",
                        type: "varchar",
                        length: "45",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("hyperz_admins");
    }
}
