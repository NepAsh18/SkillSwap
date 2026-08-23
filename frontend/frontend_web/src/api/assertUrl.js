import api from "./axiosInstance";


function resolveBackendOrigin() {
  const base = api.defaults?.baseURL || "";
  try {
    const url = new URL(base, window.location.origin);
    return url.origin;
  } catch {
    return "";
  }
}


export function resolvePictureUrl(picture) {
  if (!picture) return null;
  if (/^https?:\/\//i.test(picture)) return picture;
  const origin = resolveBackendOrigin();
  return `${origin}${picture.startsWith("/") ? "" : "/"}${picture}`;
}