# Persona files

| File | In git? | Purpose |
| --- | --- | --- |
| `vesper_instructions.example.txt` | Yes | PG placeholder the agent loads if no private file exists |
| `vesper_instructions.txt` | **No** (gitignored) | Your private instructions. Paste locally. Never commit. |

```text
copy persona\vesper_instructions.example.txt persona\vesper_instructions.txt
```

```bash
cp persona/vesper_instructions.example.txt persona/vesper_instructions.txt
```

`Agent(instructions=)` reads the private file when present. That text goes to **Grok Voice Agent API**, not Anam.
