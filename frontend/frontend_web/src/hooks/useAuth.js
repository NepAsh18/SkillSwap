export function useAuth() {
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
 
  return {
    user,
    accessToken: localStorage.getItem("accessToken"),
    roles: user?.roles ?? [],
  };
}
