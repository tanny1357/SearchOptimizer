const USER_KEY = "user"; // Key for localStorage

export function getCurrentUser() {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function loginUser(userObj) {
  localStorage.setItem(USER_KEY, JSON.stringify(userObj));
}

export function logoutUser() {
  localStorage.removeItem(USER_KEY);
}
