'use client';

import { useRouter } from 'next/navigation';
import {
  List,
  Cell,
  Section,
  Avatar,
  Spinner,
  Placeholder,
} from '@telegram-apps/telegram-ui';
import { useTherapists } from '@/hooks/useTherapists';
import { StarRating } from '@/components/StarRating';
import { formatTon } from '@/lib/ton';

export default function BrowsePage() {
  const router = useRouter();
  const { data: therapists, isLoading, error } = useTherapists();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (error) {
    return (
      <Placeholder
        header="Failed to load"
        description="Could not load therapists. Please try again."
      />
    );
  }

  if (!therapists?.length) {
    return (
      <Placeholder
        header="No therapists yet"
        description="Check back soon for available massage therapists."
      />
    );
  }

  return (
    <List>
      <Section header="Available Therapists">
        {therapists.map((t) => (
          <Cell
            key={t.id}
            before={
              <Avatar
                size={48}
                src={t.photos?.[0]}
                acronym={t.display_name.charAt(0)}
              />
            }
            after={
              <div style={{ textAlign: 'right', fontSize: 13 }}>
                <div style={{ fontWeight: 600 }}>{formatTon(t.price_ton)}</div>
                <div style={{ color: 'var(--tg-theme-hint-color)' }}>
                  {t.duration_minutes} min
                </div>
              </div>
            }
            subtitle={
              <div>
                {t.location_name && (
                  <span style={{ color: 'var(--tg-theme-hint-color)', fontSize: 12 }}>
                    📍 {t.location_name}
                  </span>
                )}
                {t.rating != null && (
                  <div style={{ marginTop: 2 }}>
                    <StarRating value={Math.round(t.rating)} readonly size={14} />
                  </div>
                )}
              </div>
            }
            onClick={() => router.push(`/client/therapist/${t.id}`)}
          >
            {t.display_name}
          </Cell>
        ))}
      </Section>
    </List>
  );
}
