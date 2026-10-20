'use server';
import type { SiteUser } from '@/domain/arcade';
/** No session lookup, credential, database or mutation in this fixture. */
export async function getCurrentUser(): Promise<SiteUser | null> { return null; }
export async function logout(): Promise<void> {}
