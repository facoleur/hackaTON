// scripts/seed-therapists.ts
// Run with: npx tsx scripts/seed-therapists.ts

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role bypasses RLS
);

const therapists = [
  {
    telegram_id: 100001,
    username: "anna_massage",
    first_name: "Anna",
    display_name: "Anna K.",
    bio: "Deep tissue & sports massage. 8 years experience.",
    price_ton: 1.5,
    duration_minutes: 60,
    upfront_percent: 50,
    location_name: "Zürich Enge",
    location_lat: 47.3625,
    location_lng: 8.5312,
    photos: [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400",
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400",
    ],
    rating: 4.8,
    wallet_address: "UQBExample1111111111111111111111111111111111111",
    availability: [
      { day_of_week: 1, start_time: "09:00", end_time: "12:00" },
      { day_of_week: 1, start_time: "14:00", end_time: "18:00" },
      { day_of_week: 3, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 5, start_time: "10:00", end_time: "16:00" },
    ],
  },
  {
    telegram_id: 100002,
    username: "marco_wellness",
    first_name: "Marco",
    display_name: "Marco B.",
    bio: "Swedish & relaxation massage. Mobile service available.",
    price_ton: 2.0,
    duration_minutes: 90,
    upfront_percent: 100,
    location_name: "Zürich Oerlikon",
    location_lat: 47.4111,
    location_lng: 8.5443,
    photos: [
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=400",
    ],
    rating: 4.5,
    wallet_address: "UQBExample2222222222222222222222222222222222222",
    availability: [
      { day_of_week: 2, start_time: "08:00", end_time: "14:00" },
      { day_of_week: 4, start_time: "08:00", end_time: "14:00" },
      { day_of_week: 6, start_time: "10:00", end_time: "15:00" },
    ],
  },
  {
    telegram_id: 100003,
    username: "lina_thai",
    first_name: "Lina",
    display_name: "Lina T.",
    bio: "Traditional Thai massage & stretching. Certified in Chiang Mai.",
    price_ton: 1.0,
    duration_minutes: 60,
    upfront_percent: 30,
    location_name: "Zürich Wiedikon",
    location_lat: 47.37,
    location_lng: 8.52,
    photos: [
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=400",
      "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400",
    ],
    rating: 4.9,
    wallet_address: "UQBExample3333333333333333333333333333333333333",
    availability: [
      { day_of_week: 1, start_time: "11:00", end_time: "19:00" },
      { day_of_week: 2, start_time: "11:00", end_time: "19:00" },
      { day_of_week: 3, start_time: "11:00", end_time: "19:00" },
      { day_of_week: 4, start_time: "11:00", end_time: "19:00" },
      { day_of_week: 5, start_time: "11:00", end_time: "19:00" },
    ],
  },
];

async function seed() {
  console.log("Seeding therapists...\n");

  for (const t of therapists) {
    // 1. Upsert user
    const { data: user, error: userErr } = await supabase
      .from("users")
      .upsert(
        {
          telegram_id: t.telegram_id,
          username: t.username,
          first_name: t.first_name,
          role: "therapist",
          wallet_address: t.wallet_address,
        },
        { onConflict: "telegram_id" }
      )
      .select("id")
      .single();

    if (userErr) {
      console.error(`Failed user ${t.username}:`, userErr.message);
      continue;
    }

    // 2. Upsert therapist profile
    const { data: profile, error: profErr } = await supabase
      .from("therapist_profiles")
      .upsert(
        {
          user_id: user.id,
          display_name: t.display_name,
          bio: t.bio,
          price_ton: t.price_ton,
          duration_minutes: t.duration_minutes,
          upfront_percent: t.upfront_percent,
          location_name: t.location_name,
          location_lat: t.location_lat,
          location_lng: t.location_lng,
          photos: t.photos,
          rating: t.rating,
          is_active: true,
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    if (profErr) {
      console.error(`Failed profile ${t.username}:`, profErr.message);
      continue;
    }

    // 3. Insert availability (delete old first)
    await supabase.from("availability").delete().eq("therapist_id", profile.id);

    const slots = t.availability.map((a) => ({
      therapist_id: profile.id,
      ...a,
    }));

    const { error: availErr } = await supabase
      .from("availability")
      .insert(slots);

    if (availErr) {
      console.error(`Failed availability ${t.username}:`, availErr.message);
      continue;
    }

    console.log(
      `  ${t.display_name} — ${t.location_name} — ${t.price_ton} TON — ${t.upfront_percent}% upfront — ${t.availability.length} slots`
    );
  }

  console.log("\nDone. 3 therapists seeded.");
}

seed().catch(console.error);
