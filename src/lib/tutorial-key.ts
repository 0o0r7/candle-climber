// Tutorial "seen" flag version — shared by Tutorial.tsx (writes it on finish)
// and GameCanvas.tsx (reads it to decide whether to auto-show the wizard).
//
// v1 → v2 bump (2026-10-15, owner-reported): after the 2026-10-14 entry-card
// cleanup folded the inline how-to facts INTO the wizard steps, returning
// players still carried the old v1 flag, so the wizard never auto-showed for
// them again and the small HOW TO PLAY ghost button was too weak to register
// — the owner reasonably concluded the wizard had been deleted. Bumping the
// key gives every returning player exactly ONE re-show of the (now enriched)
// wizard, then settles back to first-visit-only behavior.
//
// Rule for future edits: bump only when tutorial content changes in a way a
// returning player should see once. Never hardcode the key string elsewhere —
// import this constant so read/write always agree.
export const TUTORIAL_KEY = "cc_tutorial_seen_v2";
