import { z } from 'zod';

const id = z.string().min(1).max(64).regex(/^[A-Za-z0-9_:-]+$/);
const flagValue = z.union([z.boolean(), z.number().finite(), z.string().max(200)]);

export const GameStateSchema = z.object({
  version: z.literal(1),
  chapter: id,
  scene: id,
  minutes: z.number().int().min(0).max(100000),
  inventory: z.array(id).max(100),
  flags: z.record(id, flagValue),
  shards: z.array(z.number().int().min(1).max(20)).max(20),
  visited: z.array(id).max(200),
  deaths: z.number().int().min(0).max(100000),
  hintsUsed: z.number().int().min(0).max(100000),
  firedEvents: z.array(id).max(200),
  notebook: z.array(id).max(200),
  over: z.object({ kind: z.enum(['death', 'ending']), id }).optional(),
  carry: z.record(id, flagValue).optional(),
}).strict();

export const SaveFileSchema = z.object({
  version: z.literal(1),
  savedAt: z.string().max(40),
  label: z.string().max(120),
  state: GameStateSchema,
  narration: z.array(z.string().max(4000)).max(40),
}).strict();

export type SaveFile = z.infer<typeof SaveFileSchema>;

export const ProfileSchema = z.object({
  version: z.literal(1),
  deathsSeen: z.array(id).max(200),
  endingsSeen: z.array(id).max(50),
  chapterFlags: z.record(id, z.record(id, flagValue)),
  settings: z.object({
    textSpeed: z.enum(['slow', 'normal', 'fast', 'instant']),
    sound: z.boolean(),
    reducedMotion: z.boolean(),
    textSize: z.enum(['small', 'normal', 'large']),
    mode1985: z.boolean(),
  }).strict(),
}).strict();

export type Profile = z.infer<typeof ProfileSchema>;
