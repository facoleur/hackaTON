'use client';

import { useState, useEffect } from 'react';
import {
  List,
  Section,
  Input,
  Textarea,
  Cell,
  Button,
  Spinner,
} from '@telegram-apps/telegram-ui';
import { useMyProfile, useUpsertProfile } from '@/hooks/useProfile';
import { hapticFeedback } from '@tma.js/sdk-react';

export default function ProfilePage() {
  const { data: profile, isLoading } = useMyProfile();
  const upsert = useUpsertProfile();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [priceTon, setPriceTon] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [upfrontPercent, setUpfrontPercent] = useState('100');
  const [locationName, setLocationName] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? '');
      setBio(profile.bio ?? '');
      setPriceTon(String(profile.price_ton ?? ''));
      setDurationMinutes(String(profile.duration_minutes ?? 60));
      setUpfrontPercent(String(profile.upfront_percent ?? 100));
      setLocationName(profile.location_name ?? '');
      setIsActive(profile.is_active ?? true);
    }
  }, [profile]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spinner size="l" />
      </div>
    );
  }

  async function handleSave() {
    try { hapticFeedback.impactOccurred('medium'); } catch {}
    await upsert.mutateAsync({
      display_name: displayName,
      bio: bio || null,
      price_ton: parseFloat(priceTon) || 0,
      duration_minutes: parseInt(durationMinutes) || 60,
      upfront_percent: Math.min(100, Math.max(10, parseInt(upfrontPercent) || 100)),
      location_name: locationName || null,
      is_active: isActive,
    });
    try { hapticFeedback.notificationOccurred('success'); } catch {}
  }

  return (
    <List>
      <Section header="Basic Info">
        <Input
          header="Display name"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Textarea
          header="Bio"
          placeholder="Tell clients about yourself and your services..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <Input
          header="Location"
          placeholder="City, neighborhood..."
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
        />
      </Section>

      <Section header="Pricing & Duration">
        <Input
          header="Price (TON)"
          type="number"
          inputMode="decimal"
          placeholder="e.g. 2.5"
          value={priceTon}
          onChange={(e) => setPriceTon(e.target.value)}
        />
        <Input
          header="Duration (minutes)"
          type="number"
          inputMode="numeric"
          placeholder="60"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
        />
        <Input
          header="Upfront % (10–100)"
          type="number"
          inputMode="numeric"
          placeholder="100"
          value={upfrontPercent}
          onChange={(e) => setUpfrontPercent(e.target.value)}
        />
      </Section>

      <Section header="Visibility">
        <Cell
          Component="label"
          after={
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: 20, height: 20, cursor: 'pointer' }}
            />
          }
        >
          Active (visible to clients)
        </Cell>
      </Section>

      <Section>
        <div style={{ padding: '8px 16px 16px' }}>
          <Button
            size="l"
            stretched
            loading={upsert.isPending}
            disabled={!displayName || !priceTon || upsert.isPending}
            onClick={handleSave}
          >
            {profile ? 'Save Changes' : 'Create Profile'}
          </Button>
        </div>
      </Section>
    </List>
  );
}
