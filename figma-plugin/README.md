# MascotForge Figma Plugin

AI-powered mascot generation plugin for Figma.

## Quick Start

See [QUICK_START.md](./QUICK_START.md) for the fastest way to preview the plugin.

## Project Structure

```
figma-plugin/
├── manifest.json          # Plugin configuration
├── src/
│   ├── code.ts           # Plugin code (runs in Figma sandbox)
│   ├── ui/               # React UI components
│   │   ├── App.tsx       # Main app component
│   │   ├── tabs/         # Tab components
│   │   └── index.html    # UI HTML template
│   ├── api/              # API client
│   └── rpc/              # RPC bridge
├── code.js               # Built plugin code (generated)
├── ui.html               # Built UI HTML (generated)
└── ui.js                 # Built UI bundle (generated)
```

## Development

### Install Dependencies
```bash
npm install
```

### Build
```bash
# One-time build
npm run build

# Watch mode (auto-rebuild on changes)
npm run dev
```

### Load in Figma

1. Open **Figma Desktop** (not browser)
2. **Plugins** → **Development** → **Import plugin from manifest...**
3. Select `manifest.json`
4. Run: **Plugins** → **Development** → **MascotForge**

## Scripts

- `npm run build` - Build plugin code and UI
- `npm run dev` - Watch mode for development
- `npm run watch` - Watch TypeScript only
- `npm run build:ui` - Build UI only
- `npm run lint` - Lint code

## Features

- **Character Tab**: Generate mascots from prompts
- **Animations Tab**: Create sprite animations
- **Logos Tab**: Generate icon packs
- **Account Tab**: View credits and billing

## API Integration

The plugin connects to the backend API. For local development:

1. Start the backend server (see `../backend/README.md`)
2. Update API URL in `src/api/client.ts` if needed
3. Or use mock responses for UI testing

## Troubleshooting

See [PLUGIN_PREVIEW_GUIDE.md](./PLUGIN_PREVIEW_GUIDE.md) for detailed troubleshooting.

## Documentation

- [Quick Start Guide](./QUICK_START.md)
- [Plugin Preview Guide](./PLUGIN_PREVIEW_GUIDE.md)
- [Figma Plugin API Docs](https://www.figma.com/plugin-docs/)
