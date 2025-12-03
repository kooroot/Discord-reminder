import { SlashCommandBuilder } from 'discord.js';

export const commands = [
  new SlashCommandBuilder()
    .setName('반복알림')
    .setDescription('반복 알림을 설정합니다')
    .addStringOption(option =>
      option
        .setName('시작시간')
        .setDescription('알림 시작 시간 (예: 2025-12-03T10:00)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('반복간격')
        .setDescription('반복 간격 (예: 10m, 2h, 1d)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('메시지')
        .setDescription('알림 메시지 (${날짜} 사용 가능)')
        .setRequired(true)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName('알림끄기')
    .setDescription('설정된 반복 알림을 끕니다')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('알림목록')
    .setDescription('현재 설정된 알림을 확인합니다')
    .toJSON(),
];
