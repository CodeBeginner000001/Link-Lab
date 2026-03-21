export type MailJobType =
  | 'WELCOME_EMAIL'
  | 'VERIFY_EMAIL'
  | 'FORGOT_PASSWORD'
  | 'RESET_PASSWORD';

export interface EmailQueueMessage {
  type: MailJobType;
  to: string;
  subject?: string;
  template?: string;
  html?: string;
  context?: Record<string, any>;
  meta?: {
    source?: string;
    project?: string;
    senderName?: string;
    senderLogo?: string;
    userId?: string;
    requestId?: string;
  };
}

export interface SendMailQueueParams {
  type: MailJobType;
  to: string;
  subject?: string;
  template?: string;
  html?: string;
  context?: Record<string, any>;
  meta?: {
    source?: string;
    userId?: string;
    requestId?: string;
  };
}
