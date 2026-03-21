import { hapticFeedback } from "@tma.js/sdk-react";

const haptic = {
  tap: () => {
    try {
      hapticFeedback.impactOccurred("medium");
    } catch {}
  },
  success: () => {
    try {
      hapticFeedback.notificationOccurred("success");
    } catch {}
  },
};

export { haptic };
