export const queryKeys = {
  therapists: {
    all: () => ['therapists'] as const,
    list: () => ['therapists', 'list'] as const,
    detail: (id: string) => ['therapists', 'detail', id] as const,
    walletAddress: (id: string) => ['therapists', 'wallet', id] as const,
  },
  bookings: {
    all: () => ['bookings'] as const,
    byUser: (userId: string) => ['bookings', 'user', userId] as const,
    detail: (id: string) => ['bookings', 'detail', id] as const,
    therapistRequests: (therapistId: string) => ['bookings', 'therapist', therapistId] as const,
  },
  profile: {
    byUser: (userId: string) => ['profile', 'user', userId] as const,
  },
  availability: {
    byTherapist: (therapistId: string) => ['availability', 'therapist', therapistId] as const,
  },
};
