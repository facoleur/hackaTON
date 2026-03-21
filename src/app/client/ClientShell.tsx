'use client';

import { type PropsWithChildren } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Tabbar } from '@telegram-apps/telegram-ui';
import { backButton } from '@tma.js/sdk-react';
import { useEffect } from 'react';

const tabs = [
  { path: '/client', label: 'Browse', icon: '🔍' },
  { path: '/client/bookings', label: 'Bookings', icon: '📋' },
];

export function ClientShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();

  const isRoot = pathname === '/client' || pathname === '/client/bookings';

  useEffect(() => {
    try {
      if (isRoot) {
        backButton.hide();
      } else {
        backButton.show();
        return backButton.onClick(() => router.back());
      }
    } catch {}
  }, [isRoot, router]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'var(--tg-viewport-stable-height, 100dvh)',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </div>
      <Tabbar>
        {tabs.map((tab) => (
          <Tabbar.Item
            key={tab.path}
            text={tab.label}
            selected={
              tab.path === '/client'
                ? pathname === '/client'
                : pathname.startsWith(tab.path)
            }
            onClick={() => router.push(tab.path)}
          >
            <span style={{ fontSize: 20 }}>{tab.icon}</span>
          </Tabbar.Item>
        ))}
      </Tabbar>
    </div>
  );
}
