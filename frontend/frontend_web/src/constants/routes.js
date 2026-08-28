export const ROUTES = {
  // User
  BROWSE: "/videos",
  WATCH: "/videos/:videoUuid",
  PLAYLISTS: "/videos/playlists",

  // Committee
  COMMITTEE_UPLOAD: "/committee/upload",
  COMMITTEE_MANAGE: "/committee/manage",
  COMMITTEE_PLAYLISTS: "/committee/playlists",
  COMMITTEE_ANALYTICS: "/committee/analytics",

  // Admin
  ADMIN_ACCOUNTABILITY: "/admin/accountability",
  ADMIN_AGE_VERIFICATION: "/admin/age-verification",
};

export function watchPath(videoUuid) {
  return `/videos/${videoUuid}`;
}