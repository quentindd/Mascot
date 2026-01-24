# How to Preview the MascotForge Figma Plugin

This guide will walk you through building and previewing the plugin in Figma Desktop.

## Prerequisites

1. **Figma Desktop App** (not the web version)
   - Download from: https://www.figma.com/downloads/
   - The plugin must run in the desktop app, not the browser

2. **Node.js 18+** installed
   - Check: `node --version`

## Step-by-Step Instructions

### 1. Install Dependencies

```bash
cd figma-plugin
npm install
```

This will install all required packages including React, TypeScript, Vite, and Figma plugin types.

### 2. Build the Plugin

You have two options:

#### Option A: One-time Build
```bash
npm run build
```

This compiles:
- TypeScript plugin code (`src/code.ts`) → `code.js`
- React UI (`src/ui/`) → `ui.html` and `ui.js`

#### Option B: Development Mode (Watch for Changes)
```bash
npm run dev
```

This runs both TypeScript and Vite in watch mode, automatically rebuilding when you make changes.

**Note:** Keep this terminal running while developing.

### 3. Load Plugin in Figma Desktop

1. **Open Figma Desktop App**
   - Make sure you're using the desktop app, not the browser

2. **Open or Create a Figma File**
   - Any file will work for testing

3. **Access Plugins Menu**
   - Go to: **Menu Bar** → **Plugins** → **Development** → **Import plugin from manifest...**
   - Or use shortcut: `Cmd+Option+P` (Mac) / `Ctrl+Alt+P` (Windows)

4. **Select the Manifest File**
   - Navigate to: `/Users/quentin/Documents/Mascot/figma-plugin/manifest.json`
   - Click **Open**

5. **Run the Plugin**
   - The plugin should appear in your plugins list
   - Go to: **Plugins** → **Development** → **MascotForge**
   - Or use: `Cmd+Option+P` → search "MascotForge"

### 4. View the Plugin UI

Once the plugin runs, you should see:
- A panel on the right side of Figma (320px wide)
- Four tabs: Character, Animations, Logos, Account
- The UI should load (you'll see an auth screen initially since the backend isn't running)

## Troubleshooting

### Plugin Doesn't Appear

**Issue:** Plugin not showing in the list

**Solutions:**
- Make sure you built the plugin first (`npm run build`)
- Check that `code.js` and `ui.html` exist in the `figma-plugin/` directory
- Verify the manifest.json path is correct
- Try restarting Figma Desktop

### Build Errors

**Issue:** TypeScript compilation errors

**Solutions:**
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Check for missing dependencies
npm install
```

### UI Not Loading

**Issue:** Blank panel or errors in console

**Solutions:**
- Open Figma's Developer Console: **Plugins** → **Development** → **Show/Hide Console**
- Check for JavaScript errors
- Verify `ui.html` and `ui.js` were generated correctly
- Make sure React dependencies are installed

### "Not Authenticated" Error

**Expected:** Since the backend isn't running, you'll see the auth screen. This is normal.

To test the full flow:
1. Start the backend server (see `backend/README.md`)
2. Or mock the API responses for testing

## Development Workflow

### Recommended Workflow:

1. **Terminal 1:** Run watch mode
   ```bash
   cd figma-plugin
   npm run dev
   ```

2. **Figma Desktop:** 
   - Load the plugin once
   - After that, just reload the plugin (right-click plugin panel → Reload)
   - Changes will auto-rebuild and you can reload to see updates

3. **Make Changes:**
   - Edit files in `src/`
   - Watch mode will rebuild automatically
   - Reload plugin in Figma to see changes

### Quick Reload

After making changes:
- **Right-click** the plugin panel → **Reload**
- Or close and reopen the plugin

## Testing Without Backend

To test the UI without a running backend, you can:

1. **Mock the API responses** in `src/api/client.ts`
2. **Use local storage** for auth token (already implemented)
3. **Test UI components** independently

Example mock:
```typescript
// In src/api/client.ts, temporarily return mock data
async createMascot(data: CreateMascotRequest): Promise<MascotResponse> {
  // Mock response for testing
  return {
    id: 'mock-id',
    name: data.name,
    prompt: data.prompt,
    style: data.style,
    characterId: 'mock-character',
    status: 'completed',
    fullBodyImageUrl: 'https://via.placeholder.com/512',
    avatarImageUrl: 'https://via.placeholder.com/128',
    squareIconUrl: 'https://via.placeholder.com/256',
    referenceImageUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
```

## File Structure After Build

After running `npm run build`, you should have:

```
figma-plugin/
├── manifest.json
├── code.js          ← Generated from src/code.ts
├── ui.html          ← Generated from src/ui/index.html
├── ui.js            ← Generated from src/ui/ (React bundle)
└── src/             ← Source files (TypeScript/React)
```

## Next Steps

Once the plugin loads successfully:

1. **Connect to Backend:** Start the backend server and configure the API URL
2. **Test Features:** Try generating a mascot (will need backend)
3. **Customize UI:** Modify components in `src/ui/tabs/`
4. **Add Features:** Extend functionality in `src/code.ts`

## Additional Resources

- [Figma Plugin API Docs](https://www.figma.com/plugin-docs/)
- [Figma Plugin Examples](https://github.com/figma/plugin-samples)
- [React in Figma Plugins](https://www.figma.com/plugin-docs/best-practices/react/)
