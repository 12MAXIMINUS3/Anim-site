import { z } from 'zod';

export const emailSchema = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(72, 'Use 72 characters or fewer')
  .regex(/[A-Za-z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');
export const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number')
  .max(20, 'Enter a valid phone number')
  .regex(/^[+()\d\s.-]+$/, 'Use digits, spaces, +, -, ( ) only');

export const addressFields = {
  fullName: z.string().trim().min(2, 'Enter the recipient’s full name').max(100),
  line1: z.string().trim().min(3, 'Enter a street address').max(120),
  line2: z.string().trim().max(120).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'Enter a city').max(80),
  state: z.string().trim().min(2, 'Enter a state, province or region').max(80),
  postalCode: z.string().trim().min(2, 'Enter a postal code').max(12, 'Postal code is too long'),
  country: z.string().length(2, 'Choose a country'),
};
