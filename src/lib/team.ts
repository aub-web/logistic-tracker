// The fixed roster the login form's name selector is restricted to. This
// isn't a real per-person account system (see admin-session.ts) — it just
// stops anyone with the shared PIN from attributing changes to a made-up
// name, and keeps "Updated By" values consistent (no "aubrey" vs "Aubrey"
// vs "Aub" drift).
export const TEAM_MEMBERS = [
  "Aubrey",
  "Nico",
  "Sweet",
  "Arnee",
  "Jave",
  "Jane",
  "Rosa",
  "Bryan",
  "David",
  "Michael - Sales",
  "Ram - Sales",
] as const;

export type TeamMember = (typeof TEAM_MEMBERS)[number];

export function isTeamMember(name: string): name is TeamMember {
  return (TEAM_MEMBERS as readonly string[]).includes(name);
}
