import type { Profile } from "./types";
import { DEMO_PEACE_ID, DEMO_WILSON_ID } from "./demo-store";

/** Fixed couple identities used across every device. */
export function coupleProfiles(): Profile[] {
  const now = new Date().toISOString();
  return [
    {
      id: DEMO_PEACE_ID,
      display_name: "Peace",
      avatar_url: "/peace.jpg",
      partner_id: DEMO_WILSON_ID,
      role: "member",
      created_at: now,
    },
    {
      id: DEMO_WILSON_ID,
      display_name: "Wilson",
      avatar_url: "/wilson.jpg",
      partner_id: DEMO_PEACE_ID,
      role: "member",
      created_at: now,
    },
  ];
}
