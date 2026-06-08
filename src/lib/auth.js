/**
 * Family Home Hub — Authentication helpers
 *
 * All auth operations go through Supabase.
 * Tokens are managed by the Supabase SDK — never stored manually.
 */
import { supabase } from './supabase.js'

/** Sign in with email + password */
export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/**
 * Send a magic link to the user's email.
 * On click the user lands back at VITE_APP_URL with a session.
 */
export async function signInWithMagicLink(email) {
  const redirectTo = `${import.meta.env.VITE_APP_URL ?? window.location.origin}/`
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  })
  if (error) throw error
}

/**
 * Create a new Supabase user account.
 * A database trigger (see supabase/schema.sql) automatically creates
 * the household + owner member row after signup.
 */
export async function register(email, password, householdName = 'My Family') {
  const redirectTo = `${import.meta.env.VITE_APP_URL ?? window.location.origin}/`
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: { household_name: householdName },
    },
  })
  if (error) throw error
  return data
}

/** Send a password-reset email */
export async function resetPassword(email) {
  const redirectTo = `${import.meta.env.VITE_APP_URL ?? window.location.origin}/reset-password`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw error
}

/** Update the current user's password (called from reset-password flow) */
export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

/** Sign out of Supabase (clears session + localStorage token) */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** Get the current authenticated user (returns null if not signed in) */
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
