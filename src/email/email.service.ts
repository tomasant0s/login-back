import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: any[],
  ): Promise<void> {
    const mailOptions = {
      from: `"Nutri Inteligente" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
      attachments,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`E-mail enviado com sucesso: ${info.messageId}`);
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail', error);
      throw error;
    }
  }
}
