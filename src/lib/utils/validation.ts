import { z } from 'zod';

export const ToolTypeSchema = z.enum(['image', 'video', 'voice', 'script']);
export const QualityTierSchema = z.enum(['standard', 'premium', 'ultra']);
export const UUIDSchema = z.string().uuid();
