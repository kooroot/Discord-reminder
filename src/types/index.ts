import { ScheduledTask } from 'node-cron';

export interface Reminder {
  userId: string;
  channelId: string;
  guildId: string;
  message: string;
  startTime: string;
  interval: string;
  createdAt: string;
}

export interface ActiveReminder {
  task: ScheduledTask;
  timeout?: NodeJS.Timeout;
  reminder: Reminder;
}

export interface RemindersData {
  [key: string]: Reminder;
}

export interface ParsedInterval {
  value: number;
  unit: string;
  milliseconds: number;
}
