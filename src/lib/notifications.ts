import nodemailer from 'nodemailer';
import type { Environment } from '../config.js';
import { sendEvolutionMessage } from './evolution.js';

export async function sendHelpdeskEmail(
  env: Environment,
  subject: string,
  body: string,
): Promise<void> {
  const transporter = nodemailer.createTransport(env.helpdeskSmtpUrl);

  await transporter.sendMail({
    from: env.helpdeskEmailFrom,
    to: env.helpdeskEmailTo,
    subject,
    text: body,
  });
}

export async function notifyHelpdeskWhatsApp(env: Environment, message: string): Promise<void> {
  await sendEvolutionMessage(env, {
    to: env.helpdeskEscalationNumber,
    message,
  });
}
