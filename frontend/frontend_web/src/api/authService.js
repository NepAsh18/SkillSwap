import api from "./axiosInstance";

let _accessToken = null;

export function setAccessToken(token) {
  _accessToken = token;
}

export function clearAccessToken() {
  _accessToken = null;
}

// interceptors
api.interceptors.request.use(
  (config) => {
    if (_accessToken) {
      config.headers.Authorization = `Bearer ${_accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// login
// Returns EITHER a real AuthResponse ({ accessToken, refreshToken, user })
// OR a PreAuthResponse ({ preAuthToken, message, expiresInSeconds, otpRequired: true })
// depending on whether the user's 10-hour OTP trust window is still valid.
export async function login({ identity, password }) {
  const { data } = await api.post("/auth/login", {
    identity,
    password,
  });

  if (!data.otpRequired && data.accessToken) {
    setAccessToken(data.accessToken);
  }

  return data;
}

// register
// Always returns a PreAuthResponse — registration requires OTP verification
// before any real tokens are issued.
export async function register({ name, email, password }) {
  const { data } = await api.post("/auth/register", {
    name,
    email,
    password,
  });

  return data;
}

// verify-otp
// Submits the pre-auth token + 6-digit code, returns a real AuthResponse on success.
export async function verifyOtp({ preAuthToken, code }) {
  const { data } = await api.post("/auth/verify-otp", {
    preAuthToken,
    code,
  });

  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }

  return data;
}

// resend-otp
// Works for both register and login pre-auth sessions — mints a fresh
// pre-auth token + sends a new code, without re-running register/login.
export async function resendOtp({ preAuthToken }) {
  const { data } = await api.post("/auth/resend-otp", {
    preAuthToken,
  });

  return data; // PreAuthResponse: { preAuthToken, message, expiresInSeconds }
}

export async function logout() {
  await api.post("/auth/logout");
  clearAccessToken();
}

export default api;