/**
 * Mirrors the preauthorize role names on the backend controllers.
 * hasRole('X') in Spring Security checks for authority "ROLE_X" — keep
 * these in sync with whatever your JWT's roles/authorities claim contains.
 */
export const ROLES = {
  USER: "ROLE_USER",
  COMMITTEE: "ROLE_COMMITTEE",
  ADMIN: "ROLE_ADMIN",
};

export const PROCESSING_STATUS = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  READY: "READY",
  FAILED: "FAILED",
};