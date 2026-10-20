'use client';
import type { LiveGame } from '@/domain/live-game';
/** SSR transport fixture excludes browser polling entirely. */
export function useLiveGames(): LiveGame[] | null { return null; }
