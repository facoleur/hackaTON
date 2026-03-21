import type { PropsWithChildren } from 'react';
import { ClientShell } from './ClientShell';
import { Providers } from '@/app/providers';

export default function ClientLayout({ children }: PropsWithChildren) {
  return (
    <Providers role="client">
      <ClientShell>{children}</ClientShell>
    </Providers>
  );
}
