export function saveToken(token: string) {
  localStorage.setItem("client_token", token);
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("client_token");
}

export function clearToken() {
  localStorage.removeItem("client_token");
}
