import PocketBase from 'pocketbase';

const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
export const pb = new PocketBase(pbUrl);

// Disable auto-cancellation to prevent React 18/19 StrictMode and concurrent request cancellation errors
pb.autoCancellation(false);

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await pb.collection("users").requestPasswordReset(email.trim());
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.response?.message || err?.message || "Failed to request password reset." };
  }
}
