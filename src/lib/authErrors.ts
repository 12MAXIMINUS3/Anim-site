/** Maps Supabase/Auth error messages to friendly copy. */
export function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'Something went wrong.';
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'That email and password combination is incorrect.';
  if (m.includes('email not confirmed')) return 'Please confirm your email address — check your inbox for the confirmation link.';
  if (m.includes('user already registered')) return 'An account with this email already exists. Try signing in instead.';
  if (m.includes('password should be at least')) return 'Your password is too short. Use at least 8 characters.';
  if (m.includes('rate limit') || m.includes('too many requests')) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'We couldn’t reach the server. Check your connection and try again.';
  if (m.includes('jwt') && m.includes('expired')) return 'Your session expired. Please sign in again.';
  if (m.includes('duplicate key') || m.includes('23505')) return 'That record already exists.';
  if (m.includes('row-level security')) return 'You don’t have permission to do that.';
  return message;
}
