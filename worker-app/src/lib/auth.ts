export function saveToken(token: string) {
  localStorage.setItem("worker_token", token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("worker_token");
}

export function clearToken() {
  localStorage.removeItem("worker_token");
}
