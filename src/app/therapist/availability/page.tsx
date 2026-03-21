'use client';

import { useState } from 'react';
import {
  List,
  Section,
  Cell,
  Button,
  Spinner,
  Placeholder,
  Input,
} from '@telegram-apps/telegram-ui';
import { useMyProfile } from '@/hooks/useProfile';
import { useAvailability, useAddAvailability, useDeleteAvailability } from '@/hooks/useAvailability';
import { hapticFeedback } from '@tma.js/sdk-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityPage() {
  const { data: profile, isLoading: profileLoading } = useMyProfile();
  const { data: slots, isLoading: slotsLoading } = useAvailability(profile?.id ?? '');
  const addSlot = useAddAvailability(profile?.id ?? '');
  const deleteSlot = useDeleteAvailability(profile?.id ?? '');

  const [selectedDay, setSelectedDay] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  if (profileLoading || slotsLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Placeholder
        header="Profile required"
        description="Create your profile first before setting availability."
      />
    );
  }

  async function handleAdd() {
    try { hapticFeedback.impactOccurred('light'); } catch {}
    await addSlot.mutateAsync({
      day_of_week: selectedDay,
      start_time: startTime,
      end_time: endTime,
    });
    try { hapticFeedback.notificationOccurred('success'); } catch {}
  }

  async function handleDelete(id: string) {
    try { hapticFeedback.impactOccurred('medium'); } catch {}
    await deleteSlot.mutateAsync(id);
  }

  const byDay = DAY_NAMES.map((name, day) => ({
    day,
    name,
    slots: slots?.filter((s) => s.day_of_week === day) ?? [],
  })).filter((d) => d.slots.length > 0);

  return (
    <List>
      <Section header="Add Time Slot">
        <Cell>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '4px 0' }}>
            {DAY_NAMES.map((name, i) => (
              <button
                key={i}
                onClick={() => setSelectedDay(i)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: '1px solid var(--tg-theme-button-color, #2481cc)',
                  background: selectedDay === i
                    ? 'var(--tg-theme-button-color, #2481cc)'
                    : 'transparent',
                  color: selectedDay === i
                    ? 'var(--tg-theme-button-text-color, #fff)'
                    : 'var(--tg-theme-button-color, #2481cc)',
                  fontSize: 13,
                  cursor: 'pointer',
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
        </Cell>
        <Input
          header="Start time"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <Input
          header="End time"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
        <div style={{ padding: '8px 16px 16px' }}>
          <Button
            size="l"
            stretched
            loading={addSlot.isPending}
            disabled={addSlot.isPending}
            onClick={handleAdd}
          >
            Add Slot
          </Button>
        </div>
      </Section>

      {byDay.length > 0 ? (
        byDay.map(({ day, name, slots: daySlots }) => (
          <Section key={day} header={name}>
            {daySlots.map((slot) => (
              <Cell
                key={slot.id}
                after={
                  <Button
                    size="s"
                    mode="plain"
                    onClick={() => handleDelete(slot.id)}
                    loading={deleteSlot.isPending}
                  >
                    Remove
                  </Button>
                }
              >
                {slot.start_time} – {slot.end_time}
              </Cell>
            ))}
          </Section>
        ))
      ) : (
        <Placeholder
          header="No slots set"
          description="Add your weekly availability above."
        />
      )}
    </List>
  );
}
