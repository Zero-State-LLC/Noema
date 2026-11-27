# Code-mode skills

Saved scripts that worked. **Check here before writing new code**:
`python3 codemode/search_tools.py <words>` lists matching skills first.

## Save a skill

When a code-mode script works and the task will come up again:

1. Create `codemode/skills/<name>/` (snake_case).
2. Put the code in `<name>.py`. Expose a function that returns data, plus a
   `__main__` block that prints a short digest.
3. Write `SKILL.md` with front matter, then what it does, how to call it (CLI
   and import), what the output looks like, and the date and run it was
   verified on:

   ```markdown
   ---
   name: <name>
   description: One line. When to reach for it and what it returns.
   ---
   ```

Skills follow the same rules as any code-mode script. They run through
`codemode/run.py`, they are read-only unless the name says otherwise, and they
contain no tokens, personal data or private prompts. These are agent dev
tooling for this repo. They are not product skills: the player-facing skill
ships from `noema-client/skills/noema`.
