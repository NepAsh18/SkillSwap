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
export async function login({ identity, password }) {
  const { data } = await api.post("/auth/login", {
    identity,
    password,
  });

  setAccessToken(data.accessToken);
  return data;
}

// register
export async function register({ name, email, password }) {
  const { data } = await api.post("/auth/register", {
    name,
    email,
    password,
  });

  return data;
}

export async function logout() {
  await api.post("/auth/logout");
  clearAccessToken();
}

export default api;