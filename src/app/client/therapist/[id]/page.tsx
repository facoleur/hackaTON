"use client";

import { StarRating } from "@/components/StarRating";
import { useAvailability } from "@/hooks/useAvailability";
import { useCreateBooking } from "@/hooks/useBookings";
import { useTherapist } from "@/hooks/useTherapists";
import { formatTon } from "@/lib/ton";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  Avatar,
  Button,
  Cell,
  Input,
  List,
  Modal,
  Placeholder,
  Section,
  Spinner,
} from "@telegram-apps/telegram-ui";
import { hapticFeedback } from "@tma.js/sdk-react";
import { useRouter } from "next/navigation";
import { use, useState } from "react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  params: Promise<{ id: string }>;
}

export default function TherapistDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: therapist, isLoading } = useTherapist(id);
  const { data: slots } = useAvailability(id);
  const createBooking = useCreateBooking();

  const [selectedSlot, setSelectedSlot] = useState<{
    day: number;
    start: string;
    end: string;
  } | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [showModal, setShowModal] = useState(false);

  const token = useAuthStore((s) => s.supabaseToken);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spinner size="l" />
      </div>
    );
  }

  if (!therapist) {
    return (
      <Placeholder header="Not found" description="Therapist not found." />
    );
  }

  const upfrontAmount = (therapist.price_ton * therapist.upfront_percent) / 100;
  const remainingAmount = therapist.price_ton - upfrontAmount;

  async function handleBook() {
    if (!selectedSlot || !bookingDate || !therapist) return;
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}
    await createBooking.mutateAsync({
      therapist_id: therapist.id,
      booking_date: bookingDate,
      start_time: selectedSlot.start,
      duration_minutes: therapist.duration_minutes,
      amount_ton: therapist.price_ton,
      upfront_percent: therapist.upfront_percent,
      upfront_amount: upfrontAmount,
      remaining_amount: remainingAmount,
    });
    try {
      hapticFeedback.notificationOccurred("success");
    } catch {}
    router.push("/client/bookings");
  }

  return (
    <List>
      <Section>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px 16px",
          }}
        >
          <Avatar
            size={96}
            src={therapist.photos?.[0]}
            acronym={therapist.display_name.charAt(0)}
          />
          <h2 style={{ margin: "12px 0 4px", fontSize: 22 }}>
            {therapist.display_name}
          </h2>
          {therapist.rating != null && (
            <StarRating
              value={Math.round(therapist.rating)}
              readonly
              size={20}
            />
          )}
          {therapist.location_name && (
            <p
              style={{
                margin: "8px 0 0",
                color: "var(--tg-theme-hint-color)",
                fontSize: 14,
              }}
            >
              📍 {therapist.location_name}
            </p>
          )}
        </div>
      </Section>

      {therapist.bio && (
        <Section header="About">
          <Cell multiline>{therapist.bio}</Cell>
        </Section>
      )}

      <Section header="Pricing">
        <Cell after={formatTon(therapist.price_ton)}>Session price</Cell>
        <Cell after={`${therapist.duration_minutes} min`}>Duration</Cell>
        <Cell after={`${therapist.upfront_percent}%`}>Upfront required</Cell>
        <Cell after={formatTon(upfrontAmount)}>Pay now</Cell>
        {therapist.upfront_percent < 100 && (
          <Cell after={formatTon(remainingAmount)}>Pay after session</Cell>
        )}
      </Section>

      {slots && slots.length > 0 && (
        <Section header="Available Time Slots">
          {slots.map((slot) => (
            <Cell
              key={slot.id}
              onClick={() => {
                try {
                  hapticFeedback.impactOccurred("light");
                } catch {}
                setSelectedSlot({
                  day: slot.day_of_week,
                  start: slot.start_time,
                  end: slot.end_time,
                });
                setShowModal(true);
              }}
            >
              {DAY_NAMES[slot.day_of_week]} · {slot.start_time} –{" "}
              {slot.end_time}
            </Cell>
          ))}
        </Section>
      )}

      {!token && (
        <Section>
          <Placeholder description="Sign in via Telegram to book a session." />
        </Section>
      )}

      <Modal
        open={showModal}
        onOpenChange={setShowModal}
        header={<Modal.Header>Book a Session</Modal.Header>}
        title="Book a Session"
      >
        {/* <Dialog.Title>Book a Session</Dialog.Title> */}
        <div style={{ padding: "0 16px 24px" }}>
          {selectedSlot && (
            <p style={{ marginBottom: 16 }}>
              {DAY_NAMES[selectedSlot.day]} · {selectedSlot.start} –{" "}
              {selectedSlot.end}
            </p>
          )}
          <Input
            type="date"
            header="Select date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Button
            size="l"
            stretched
            loading={createBooking.isPending}
            disabled={!bookingDate || createBooking.isPending}
            onClick={handleBook}
          >
            Book – Pay {formatTon(upfrontAmount)} upfront
          </Button>
        </div>
      </Modal>
    </List>
  );
}
