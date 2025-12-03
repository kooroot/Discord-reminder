import { REST, Routes } from 'discord.js';
import { commands } from './commands';

const TOKEN = process.env.DISCORD_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands(): Promise<void> {
  try {
    console.log('🔄 슬래시 커맨드 등록 시작...');

    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });

    console.log('✅ 슬래시 커맨드 등록 완료!');
  } catch (error) {
    console.error('❌ 커맨드 등록 실패:', error);
  }
}

registerCommands();
