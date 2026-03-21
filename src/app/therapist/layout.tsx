import type { PropsWithChildren } from 'react';
import { TherapistShell } from './TherapistShell';
import { Providers } from '@/app/providers';

export default function TherapistLayout({ children }: PropsWithChildren) {
  return (
    <Providers role="therapist">
      <TherapistShell>{children}</TherapistShell>
    </Providers>
  );
}
