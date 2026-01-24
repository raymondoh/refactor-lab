// src/utils/get-initials.ts

export const getInitials = (name?: string | null, email?: string | null): string | null => {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return name.charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  if (email) {
    return email.substring(0, 2).toUpperCase();
  }

  return null; // 👈 return null instead of "UN"
};
