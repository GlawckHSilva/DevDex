// Runtime access is added with the Supabase connection in the first MVP slice.
// Keeping schema and migrations independent prevents database calls in UI code.
export * from "./schema";
