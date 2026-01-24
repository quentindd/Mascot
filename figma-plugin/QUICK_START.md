# Quick Start - Preview Plugin in 3 Steps

## Step 1: Install Dependencies
```bash
cd figma-plugin
npm install
```

## Step 2: Build the Plugin
```bash
npm run build
```

This creates:
- `code.js` (plugin code)
- `ui.html` (UI HTML)
- `ui.js` (React UI bundle)

## Step 3: Load in Figma Desktop

1. Open **Figma Desktop App** (not browser)
2. Open any file
3. Go to: **Plugins** → **Development** → **Import plugin from manifest...**
4. Select: `figma-plugin/manifest.json`
5. Run: **Plugins** → **Development** → **MascotForge**

## That's it! 🎉

The plugin panel will appear on the right side.

---

## Development Mode (Auto-rebuild)

For active development, use watch mode:

```bash
npm run dev
```

Then reload the plugin in Figma after making changes (right-click plugin panel → Reload).

---

## Troubleshooting

**Plugin not showing?**
- Make sure you ran `npm run build` first
- Check that `code.js` and `ui.html` exist in `figma-plugin/` folder
- Restart Figma Desktop

**Build errors?**
- Run `npm install` again
- Check Node.js version: `node --version` (needs 18+)

**UI not loading?**
- Open Figma Console: **Plugins** → **Development** → **Show/Hide Console**
- Check for JavaScript errors

For more details, see [PLUGIN_PREVIEW_GUIDE.md](./PLUGIN_PREVIEW_GUIDE.md)
