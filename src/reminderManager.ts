import * as fs from 'fs';
import * as path from 'path';
import cron, { ScheduledTask } from 'node-cron';
import { Client, TextChannel } from 'discord.js';
import { Reminder, ActiveReminder, RemindersData } from './types';
import { parseInterval, intervalToCron, parseStartTime, formatMessage, getNow } from './utils';

const DATA_FILE = path.join(process.cwd(), 'data', 'reminders.json');
const activeReminders: Map<string, ActiveReminder> = new Map();

/**
 * 데이터 디렉토리 확인 및 생성
 */
function ensureDataDir(): void {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * 저장된 알림 목록을 불러옵니다
 */
export function loadReminders(): RemindersData {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return {};
  }
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/**
 * 알림을 파일에 저장합니다
 */
function saveReminders(reminders: RemindersData): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(reminders, null, 2), 'utf-8');
}

/**
 * 새 알림을 저장합니다
 */
export function saveReminder(userId: string, reminder: Reminder): void {
  const reminders = loadReminders();
  reminders[userId] = reminder;
  saveReminders(reminders);
}

/**
 * 알림을 삭제합니다
 */
export function removeReminder(userId: string): void {
  const reminders = loadReminders();
  delete reminders[userId];
  saveReminders(reminders);
}

/**
 * 사용자의 알림을 조회합니다
 */
export function getReminder(userId: string): Reminder | null {
  const reminders = loadReminders();
  return reminders[userId] || null;
}

/**
 * 알림을 스케줄링합니다
 */
export async function scheduleReminder(
  client: Client,
  userId: string,
  channelId: string,
  guildId: string,
  startTimeStr: string,
  intervalStr: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  // 기존 알림이 있으면 중지
  stopReminder(userId);

  // 간격 파싱
  const interval = parseInterval(intervalStr);
  if (!interval) {
    return { success: false, error: '잘못된 반복 간격 형식입니다. (예: 10m, 2h, 1d)' };
  }

  // 시작 시간 파싱
  const startTime = parseStartTime(startTimeStr);
  if (!startTime) {
    return { success: false, error: '잘못된 시간 형식입니다. (예: 2025-12-03T10:00)' };
  }

  let channel: TextChannel;
  try {
    channel = await client.channels.fetch(channelId) as TextChannel;
    if (!channel) {
      return { success: false, error: '채널을 찾을 수 없습니다.' };
    }
  } catch (error) {
    return { success: false, error: '채널에 접근할 수 없습니다. 봇 권한을 확인해주세요.' };
  }

  const reminder: Reminder = {
    userId,
    channelId,
    guildId,
    message,
    startTime: startTimeStr,
    interval: intervalStr,
    createdAt: getNow().format(),
  };

  // 메시지 전송 함수
  const sendMessage = async () => {
    try {
      const formattedMessage = formatMessage(message);
      await channel.send(formattedMessage);
    } catch (error) {
      console.error(`알림 전송 실패 (userId: ${userId}):`, error);
    }
  };

  const now = getNow();
  const cronExpression = intervalToCron(interval.milliseconds);

  // cron 작업 생성
  const task: ScheduledTask = cron.schedule(cronExpression, sendMessage, {
    scheduled: false,
  });

  const activeReminder: ActiveReminder = {
    task,
    reminder,
  };

  // 시작 시간이 미래인 경우
  if (startTime.isAfter(now)) {
    const delay = startTime.diff(now);
    activeReminder.timeout = setTimeout(async () => {
      await sendMessage();
      task.start();
    }, delay);
  } else {
    // 시작 시간이 과거면 즉시 cron 시작 (첫 메시지는 다음 주기에)
    task.start();
  }

  activeReminders.set(userId, activeReminder);
  saveReminder(userId, reminder);

  return { success: true };
}

/**
 * 알림을 중지합니다
 */
export function stopReminder(userId: string): boolean {
  const active = activeReminders.get(userId);
  if (!active) {
    return false;
  }

  if (active.timeout) {
    clearTimeout(active.timeout);
  }
  active.task.stop();
  activeReminders.delete(userId);
  removeReminder(userId);

  return true;
}

/**
 * 저장된 알림들을 복구합니다
 */
export async function restoreReminders(client: Client): Promise<void> {
  const reminders = loadReminders();

  for (const [userId, reminder] of Object.entries(reminders)) {
    console.log(`🔄 알림 복구 중: ${userId}`);

    const result = await scheduleReminder(
      client,
      reminder.userId,
      reminder.channelId,
      reminder.guildId,
      reminder.startTime,
      reminder.interval,
      reminder.message
    );

    if (result.success) {
      console.log(`✅ 알림 복구 완료: ${userId}`);
    } else {
      console.error(`❌ 알림 복구 실패: ${userId} - ${result.error}`);
      removeReminder(userId);
    }
  }
}
