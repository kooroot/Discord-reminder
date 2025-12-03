import { Client, Events, GatewayIntentBits, ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { scheduleReminder, stopReminder, restoreReminders, getReminder } from './reminderManager';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

// 봇 준비 완료
client.once(Events.ClientReady, async (readyClient) => {
  console.log(`✅ ${readyClient.user.tag}로 로그인되었습니다!`);

  // 저장된 알림 복구
  await restoreReminders(client);
  console.log('✅ 알림 복구 완료');
});

// 슬래시 커맨드 처리
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case '반복알림':
        await handleRepeatReminder(interaction);
        break;
      case '알림끄기':
        await handleStopReminder(interaction);
        break;
      case '알림목록':
        await handleListReminder(interaction);
        break;
      default:
        await interaction.reply({ content: '알 수 없는 명령어입니다.', flags: MessageFlags.Ephemeral });
    }
  } catch (error) {
    console.error('명령어 처리 오류:', error);
    const errorMessage = '명령어 처리 중 오류가 발생했습니다.';
    try {
      if (interaction.replied) {
        await interaction.followUp({ content: errorMessage, flags: MessageFlags.Ephemeral });
      } else if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, flags: MessageFlags.Ephemeral });
      }
    } catch (e) {
      console.error('에러 응답 실패:', e);
    }
  }
});

/**
 * 반복알림 명령어 처리
 */
async function handleRepeatReminder(interaction: ChatInputCommandInteraction): Promise<void> {
  const startTime = interaction.options.getString('시작시간', true);
  const interval = interaction.options.getString('반복간격', true);
  const message = interaction.options.getString('메시지', true);

  console.log('1. deferReply 시작');
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  console.log('2. deferReply 완료');

  console.log('3. scheduleReminder 시작');
  const result = await scheduleReminder(
    client,
    interaction.user.id,
    interaction.channelId,
    interaction.guildId!,
    startTime,
    interval,
    message
  );
  console.log('4. scheduleReminder 완료', result);

  if (result.success) {
    console.log('5. editReply 시작 (성공)');
    await interaction.editReply({
      content: `✅ 반복 알림이 설정되었습니다!\n` +
        `📅 시작 시간: ${startTime}\n` +
        `🔁 반복 간격: ${interval}\n` +
        `💬 메시지: ${message}`,
    });
  } else {
    await interaction.editReply({
      content: `❌ 알림 설정 실패: ${result.error}`,
    });
  }
}

/**
 * 알림끄기 명령어 처리
 */
async function handleStopReminder(interaction: ChatInputCommandInteraction): Promise<void> {
  const stopped = stopReminder(interaction.user.id);

  if (stopped) {
    await interaction.reply({
      content: '✅ 알림이 해제되었습니다.',
      flags: MessageFlags.Ephemeral,
    });
  } else {
    await interaction.reply({
      content: '❌ 설정된 알림이 없습니다.',
      flags: MessageFlags.Ephemeral,
    });
  }
}

/**
 * 알림목록 명령어 처리
 */
async function handleListReminder(interaction: ChatInputCommandInteraction): Promise<void> {
  const reminder = getReminder(interaction.user.id);

  if (reminder) {
    await interaction.reply({
      content: `📋 현재 설정된 알림:\n` +
        `📅 시작 시간: ${reminder.startTime}\n` +
        `🔁 반복 간격: ${reminder.interval}\n` +
        `💬 메시지: ${reminder.message}\n` +
        `📆 생성일: ${reminder.createdAt}`,
      flags: MessageFlags.Ephemeral,
    });
  } else {
    await interaction.reply({
      content: '❌ 설정된 알림이 없습니다.',
      flags: MessageFlags.Ephemeral,
    });
  }
}

// 봇 로그인
const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN이 설정되지 않았습니다.');
  process.exit(1);
}

client.login(TOKEN);
