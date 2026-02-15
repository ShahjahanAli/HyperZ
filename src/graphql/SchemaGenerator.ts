// ──────────────────────────────────────────────────────────────
// HyperZ — GraphQL Schema Generator
//
// Auto-generates GraphQL type definitions and resolvers from
// HyperZ model files in the app/models directory.
// ──────────────────────────────────────────────────────────────

import * as fs from 'node:fs';
import * as path from 'node:path';

interface ModelField {
    name: string;
    type: string;
    nullable: boolean;
}

interface GeneratedModel {
    name: string;
    tableName: string;
    fields: ModelField[];
}

/**
 * Scan models directory and extract model metadata for GraphQL type generation.
 */
export function discoverModels(modelsDir: string): GeneratedModel[] {
    const models: GeneratedModel[] = [];

    if (!fs.existsSync(modelsDir)) return models;

    const files = fs.readdirSync(modelsDir).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

    for (const file of files) {
        const content = fs.readFileSync(path.join(modelsDir, file), 'utf-8');
        const className = file.replace(/\.(ts|js)$/, '');

        // Extract table name from model
        const tableMatch = content.match(/static\s+table\s*=\s*['"](\w+)['"]/);
        const tableName = tableMatch?.[1] || className.toLowerCase() + 's';

        // Extract fillable fields as GraphQL fields
        const fillableMatch = content.match(/static\s+fillable\s*=\s*\[([\s\S]*?)\]/);
        const fields: ModelField[] = [
            { name: 'id', type: 'ID', nullable: false },
        ];

        if (fillableMatch) {
            const fieldNames = fillableMatch[1]
                .split(',')
                .map((s) => s.trim().replace(/['"]/g, ''))
                .filter(Boolean);

            for (const name of fieldNames) {
                fields.push({
                    name,
                    type: inferGraphQLType(name),
                    nullable: true,
                });
            }
        }

        // Add timestamp fields
        fields.push(
            { name: 'created_at', type: 'String', nullable: true },
            { name: 'updated_at', type: 'String', nullable: true },
        );

        models.push({ name: className, tableName, fields });
    }

    return models;
}

/**
 * Infer GraphQL type from field name conventions.
 */
function inferGraphQLType(fieldName: string): string {
    if (fieldName.endsWith('_id') || fieldName === 'id') return 'ID';
    if (fieldName.startsWith('is_') || fieldName.startsWith('has_')) return 'Boolean';
    if (fieldName.endsWith('_count') || fieldName === 'age' || fieldName === 'quantity' || fieldName === 'price' || fieldName === 'amount') return 'Float';
    if (fieldName.endsWith('_at') || fieldName.endsWith('_date')) return 'String';
    if (fieldName === 'email') return 'String';
    return 'String';
}

/**
 * Generate GraphQL SDL type definitions from discovered models.
 */
export function generateTypeDefinitions(models: GeneratedModel[]): string {
    let sdl = '';

    for (const model of models) {
        sdl += `type ${model.name} {\n`;
        for (const field of model.fields) {
            sdl += `  ${field.name}: ${field.type}${field.nullable ? '' : '!'}\n`;
        }
        sdl += '}\n\n';
    }

    // Query type
    sdl += 'type Query {\n';
    for (const model of models) {
        const plural = model.tableName;
        const singular = model.name.charAt(0).toLowerCase() + model.name.slice(1);
        sdl += `  ${plural}: [${model.name}!]!\n`;
        sdl += `  ${singular}(id: ID!): ${model.name}\n`;
    }
    sdl += '  _health: HealthStatus!\n';
    sdl += '}\n\n';

    // Mutation type
    sdl += 'type Mutation {\n';
    for (const model of models) {
        const singular = model.name.charAt(0).toLowerCase() + model.name.slice(1);
        sdl += `  create${model.name}(input: ${model.name}Input!): ${model.name}!\n`;
        sdl += `  update${model.name}(id: ID!, input: ${model.name}Input!): ${model.name}\n`;
        sdl += `  delete${model.name}(id: ID!): Boolean!\n`;
    }
    sdl += '}\n\n';

    // Input types
    for (const model of models) {
        sdl += `input ${model.name}Input {\n`;
        for (const field of model.fields) {
            if (field.name === 'id' || field.name === 'created_at' || field.name === 'updated_at') continue;
            sdl += `  ${field.name}: ${field.type === 'ID' ? 'String' : field.type}\n`;
        }
        sdl += '}\n\n';
    }

    // Health type
    sdl += `type HealthStatus {\n  status: String!\n  timestamp: String!\n  framework: String!\n}\n`;

    return sdl;
}

/**
 * Get schema info for the admin panel (no graphql-yoga dependency needed).
 */
export function getGraphQLSchemaInfo(modelsDir: string): { models: GeneratedModel[]; typeDefs: string; queryCount: number; mutationCount: number } {
    const models = discoverModels(modelsDir);
    const typeDefs = generateTypeDefinitions(models);
    return {
        models,
        typeDefs,
        queryCount: models.length * 2 + 1, // list + get per model + health
        mutationCount: models.length * 3,    // create + update + delete per model
    };
}
