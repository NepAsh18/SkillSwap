/**
 * utils/authErrorMessages.js
 *
 * Maps raw backend error responses (whatever wording/status the Spring API
 * returns) to short, calm, user-facing strings. Used by LoginPage,
 * SignupPage, and OtpVerificationModal so toasts never show raw backend
 * text like "Email is already registered onto our systems." or stack-trace
 * flavored messages.
 */

export function getFriendlyAuthError(err) {
  const status = err?.response?.status;
  const backendMessage = err?.response?.data?.message || "";

  // Match on status first (most reliable), fall back to message content.
  switch (status) {
    case 409:
      return "That email is already registered. Try logging in instead.";
    case 401:
      if (/verification code/i.test(backendMessage) || /otp/i.test(backendMessage)) {
        return "That code didn't work. Please check it and try again.";
      }
      return "Incorrect email/username or password.";
    case 400:
      return "Please check the form for errors and try again.";
    case 404:
      return "We couldn't reach that service. Please try again in a moment.";
    case 429:
      return "Too many attempts. Please wait a moment before trying again.";
    case 500:
    case 502:
    case 503:
      return "Something went wrong on our end. Please try again shortly.";
    default:
      break;
  }

  // Fallback: no response at all (network error, CORS, server down)
  if (!err?.response) {
    return "Couldn't reach the server. Check your connection and try again.";
  }

  return "Something went wrong. Please try again.";
}