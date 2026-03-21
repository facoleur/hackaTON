"use client";

import { queryKeys } from "@/lib/query-keys";
import { getSupabaseClient } from "@/lib/supabase-client";
import type { Booking, CreateBookingInput } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useClientBookings() {
  const token = useAuthStore((s) => s.supabaseToken);
  const userId = useAuthStore((s) => s.telegramUser?.id);

  return useQuery({
    queryKey: queryKeys.bookings.byUser(userId ?? ""),
    queryFn: async () => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from("bookings")
        .select("*, therapist_profiles(*)")
        .eq("client_id", userId)
        .order("booking_date", { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!token && !!userId,
  });
}

export function useTherapistBookings(therapistProfileId: string) {
  const token = useAuthStore((s) => s.supabaseToken);

  return useQuery({
    queryKey: queryKeys.bookings.therapistRequests(therapistProfileId),
    queryFn: async () => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from("bookings")
        .select("*, users(*)")
        .eq("therapist_id", therapistProfileId)
        .order("booking_date", { ascending: true });

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!token && !!therapistProfileId,
  });
}

export function useBooking(bookingId: string) {
  const token = useAuthStore((s) => s.supabaseToken);

  return useQuery({
    queryKey: queryKeys.bookings.detail(bookingId),
    queryFn: async () => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from("bookings")
        .select("*, therapist_profiles(*)")
        .eq("id", bookingId)
        .single();

      if (error) throw error;
      return data as Booking;
    },
    enabled: !!token && !!bookingId,
  });
}

export function useCreateBooking() {
  const token = useAuthStore((s) => s.supabaseToken);
  const userId = useAuthStore((s) => s.telegramUser?.id);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateBookingInput) => {
      const supabase = getSupabaseClient(token);
      const { data, error } = await supabase
        .from("bookings")
        .insert({ ...input, client_id: userId, status: "pending" })
        .select()
        .single();

      if (error) throw error;
      return data as Booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}

export function useConfirmBooking() {
  const token = useAuthStore((s) => s.supabaseToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const supabase = getSupabaseClient(token);
      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}

export function useRejectBooking() {
  const token = useAuthStore((s) => s.supabaseToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const supabase = getSupabaseClient(token);
      const { error } = await supabase
        .from("bookings")
        .update({ status: "rejected" })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}

export function useCompleteBooking() {
  const token = useAuthStore((s) => s.supabaseToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const supabase = getSupabaseClient(token);
      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed" })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}

export function useCancelBooking() {
  const token = useAuthStore((s) => s.supabaseToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const supabase = getSupabaseClient(token);
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bookings.all() });
    },
  });
}
