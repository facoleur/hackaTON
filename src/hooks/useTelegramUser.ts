'use client';

import { initData, useSignal } from '@tma.js/sdk-react';

export function useTelegramUser() {
  const initDataState = useSignal(initData.state);
  return initDataState?.user ?? null;
}
