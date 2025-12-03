import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { ParsedInterval } from './types';

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = 'Asia/Seoul';

/**
 * 반복 간격 문자열을 파싱합니다 (예: "10m", "2h", "1d")
 */
export function parseInterval(intervalStr: string): ParsedInterval | null {
  const match = intervalStr.match(/^(\d+)(m|h|d)$/);
  if (!match) return null;

  const value = parseInt(match[1], 10);
  const unit = match[2];

  let milliseconds: number;
  switch (unit) {
    case 'm':
      milliseconds = value * 60 * 1000;
      break;
    case 'h':
      milliseconds = value * 60 * 60 * 1000;
      break;
    case 'd':
      milliseconds = value * 24 * 60 * 60 * 1000;
      break;
    default:
      return null;
  }

  return { value, unit, milliseconds };
}

/**
 * 밀리초를 cron 표현식으로 변환합니다
 */
export function intervalToCron(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / (60 * 1000));

  if (minutes < 60) {
    return `*/${minutes} * * * *`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `0 */${hours} * * *`;
  }

  const days = Math.floor(hours / 24);
  return `0 0 */${days} * *`;
}

/**
 * 시작 시간 문자열을 파싱합니다
 */
export function parseStartTime(timeStr: string): dayjs.Dayjs | null {
  const parsed = dayjs.tz(timeStr, TIMEZONE);
  if (!parsed.isValid()) return null;
  return parsed;
}

/**
 * 메시지 내 템플릿을 치환합니다
 */
export function formatMessage(message: string): string {
  const now = dayjs().tz(TIMEZONE);
  return message
    .replace(/\$\{날짜\}/g, now.format('YYYY-MM-DD'))
    .replace(/\$\{시간\}/g, now.format('HH:mm'))
    .replace(/\$\{요일\}/g, ['일', '월', '화', '수', '목', '금', '토'][now.day()] + '요일');
}

/**
 * 현재 시간을 한국 시간으로 반환합니다
 */
export function getNow(): dayjs.Dayjs {
  return dayjs().tz(TIMEZONE);
}
