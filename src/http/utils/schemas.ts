import { z } from "zod";

/**
 * Field rules shared by every route that takes the field. Limits mirror the
 * frontend's inputs: they're there so a direct API call can't store what the
 * form never could (a 1 MB bio on a public page, a negative age).
 */

/**
 * Lower-cased and trimmed before anything else: the database compares emails
 * exactly, so `Foo@x.com` would otherwise be a second account — and slip past
 * a block on `foo@x.com`.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(254));

export const orgNameSchema = z.string().trim().min(1).max(120);
export const citySchema = z.string().trim().min(1).max(80);
export const addressSchema = z.string().trim().min(1).max(200);

export const petNameSchema = z.string().trim().min(1).max(60);
export const petBioSchema = z.string().trim().max(600);
/** In years; 0 for puppies. */
export const petAgeSchema = z.int().min(0).max(30);
