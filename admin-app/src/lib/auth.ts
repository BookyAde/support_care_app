export function saveToken(token: string) {
  localStorage.setItem("admin_token", token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

export function clearToken() {
  localStorage.removeItem("admin_token");
}