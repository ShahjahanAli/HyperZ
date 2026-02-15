// ──────────────────────────────────────────────────────────────
// HyperZ Framework — Mailer (Nodemailer Wrapper)
// ──────────────────────────────────────────────────────────────

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { Logger } from '../logging/Logger.js';
import { env, envNumber } from '../support/helpers.js';

interface MailMessage {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    from?: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
        filename: string;
        path?: string;
        content?: string | Buffer;
    }>;
}

export class Mailer {
    private transporter: Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env('MAIL_HOST', 'smtp.mailtrap.io'),
            port: envNumber('MAIL_PORT', 587),
            auth: {
                user: env('MAIL_USER', ''),
                pass: env('MAIL_PASSWORD', ''),
            },
        });
    }

    /**
     * Send an email.
     */
    async send(message: MailMessage): Promise<void> {
        const fromName = env('MAIL_FROM_NAME', 'HyperZ');
        const fromAddress = env('MAIL_FROM_ADDRESS', 'noreply@hyperz.dev');

        try {
            await this.transporter.sendMail({
                from: message.from ?? `"${fromName}" <${fromAddress}>`,
                to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
                subject: message.subject,
                text: message.text,
                html: message.html,
                cc: message.cc,
                bcc: message.bcc,
                attachments: message.attachments,
            });

            Logger.info(`Mail sent to ${message.to}: ${message.subject}`);
        } catch (err: any) {
            Logger.error('Failed to send email', { error: err.message });
            throw err;
        }
    }
}
