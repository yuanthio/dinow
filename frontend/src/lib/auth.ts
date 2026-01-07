// Simpan token
export const setToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
};

// Ambil token
export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Hapus token (untuk logout)
export const removeToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
};

// Cek user login
export const isLoggedIn = () => {
  return !!getToken();
};