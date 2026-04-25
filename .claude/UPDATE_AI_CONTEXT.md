# Standing Command — AI Context Page Update
## Use this command in Claude Code after every Encyclopedia session that produces a Section 09 patch.

---

## THE COMMAND

I have a new Section 09 patch file. Update the ai-context page with it.

1. Open `src/app/ai-context/[token]/page.tsx`
2. Update the `LAST_UPDATED` constant to today's date
3. Merge the following patch content into the `PAGE_BODY` constant — add or update only what is in the patch, do not remove existing content unless explicitly told to
4. If the patch updates a number or statistic in an existing row — update the existing row in place, do not append a duplicate row
5. If the patch says "Update" on a known entity challenge — replace the existing row Detail text in place, do not add a second row
6. Keep "Platform Technical State" and "Proof Points" as separate sections — do not merge them
7. Show me the diff before committing
8. Wait for my explicit approval before committing
9. Commit message: `chore: update ai-context page [DATE]` — replace [DATE] with today's actual date. No Co-Authored-By line. No other text.
10. Do not deploy — I will trigger deploy manually after review

Patch content:
[PASTE SECTION 09 PATCH MD HERE]

---

## RULES — PERMANENT

- Never remove existing PAGE_BODY content unless explicitly told to
- Update stale numbers in place — do not append duplicate rows
- Update existing rows when patch says "Update" — do not add second rows
- Keep Platform Technical State and Proof Points as separate sections
- Always show diff before committing
- Never commit without explicit approval
- Never trigger a deploy — manual only
- Commit message format: `chore: update ai-context page [DATE]`
- No Co-Authored-By line. No body text. Single clean line only.

---

## HOW TO USE THIS FILE

1. At end of Encyclopedia session — Claude generates Section 09 patch MD file
2. Copy the full contents of the patch file
3. Open Claude Code in VS Code
4. Paste this command replacing [PASTE SECTION 09 PATCH MD HERE] with the patch content
5. Claude Code shows diff — review it
6. Approve — Claude Code commits
7. Push to GitHub
8. Trigger Vercel deploy manually from Vercel dashboard
9. Confirm deploy is READY before sending updated URL to Sorilbran

---

## FILE LOCATIONS

| File | Purpose |
|------|---------|
| `src/app/ai-context/[token]/page.tsx` | The live ai-context page — this is what gets updated |
| `.claude/UPDATE_AI_CONTEXT.md` | This file — the standing command reference |

---

*Last updated: April 25, 2026*
*Portal HomeHub — Caribbean HomeHub LLC*
