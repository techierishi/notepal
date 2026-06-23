# NotePal

A keyboard-first, cross-platform launcher with clipboard history and markdown notes.

## Features

- **Clipboard history** — background daemon captures clipboard entries; browse, search, and copy previous items
- **Markdown notes** — create, edit, preview, and delete notes stored as `.md` files with YAML frontmatter
- **Keyboard-first** — one hotkey (`Option+Command+Space`) summons the window; navigate entirely via keyboard
- **Global hotkey** — toggle window visibility from any application
- **Secret marking** — mark clipboard entries as secret to hide them from the main list

## Usage

| Action | Shortcut |
|--------|----------|
| Toggle window | `Ctrl+Shift+Space` (Linux) / `Option+Command+Space` (macOS) |
| Clipboard tab | `Command+1` |
| Notes tab | `Command+2` |
| Tab cycle | `Command+Tab` / `Command+Shift+Tab` |
| Quit | `Escape` |
| Save note | `Command+Enter` |

## Build

```bash
go build -o notepal
```

Requires [Wails v3](https://wails.io) and Go 1.21+.

## Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Wails v3 |
| Frontend | SolidJS + Vite |
| Clipboard storage | bbolt |
| Notes storage | Flat `.md` files |
| Markdown | marked + Prism.js |
