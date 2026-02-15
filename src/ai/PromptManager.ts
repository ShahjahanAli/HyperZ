import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Handle directory-based prompt templates with variable interpolation.
 */
export class PromptManager {
    private promptPath: string;

    constructor(basePath: string) {
        this.promptPath = path.join(basePath, 'prompts');
    }

    /**
     * Load a prompt template and substitute variables.
     * @example promptManager.load('hiring/job-desc@v2', { role: 'Engineer' })
     */
    async load(name: string, variables: Record<string, string> = {}): Promise<string> {
        const [baseName, version] = name.split('@');
        const fileName = version ? `${baseName}.${version}.md` : `${baseName}.md`;
        const filePath = path.join(this.promptPath, fileName);

        try {
            let content = await fs.readFile(filePath, 'utf-8');

            for (const [key, value] of Object.entries(variables)) {
                content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
            }

            return content.trim();
        } catch (err) {
            throw new Error(`[HyperZ] Prompt template "${name}" not found at ${filePath}`);
        }
    }

    /**
     * List all available prompts.
     */
    async list(): Promise<string[]> {
        // Recursive list of .md files
        return [];
    }
}
