import type { User } from 'firebase/auth';

const parseAdminEmails = (): Set<string> => {
  const raw = process.env.NEXT_PUBLIC_AI_GUIDES_ADMIN_EMAILS || '';
  return new Set(
    raw
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );
};

export function isAiGuidesAdmin(user: User | null | undefined): boolean {
  if (!user?.email) return false;
  const admins = parseAdminEmails();
  if (admins.size === 0) return false;
  return admins.has(user.email.toLowerCase());
}
