// This file runs in the Figma plugin sandbox (not in the UI iframe)

import { MascotAPI } from './api/client';
import { RPC } from './rpc/rpc';

// Initialize RPC bridge
const rpc = new RPC();

// Initialize API client (will be set when user authenticates)
let apiClient: MascotAPI | null = null;

// Error handling wrapper
function handleError(error: any, context: string) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(`[Mascot Error in ${context}]:`, errorMessage);
  console.error('Full error:', error);
  rpc.send('error', {
    message: errorMessage,
    context,
  });
}

// Load stored token on startup and send to UI
(async () => {
  try {
    const storedToken = await figma.clientStorage.getAsync('mascot_token');
    if (storedToken) {
      apiClient = new MascotAPI(storedToken);
      rpc.send('token-loaded', { token: storedToken });
    }
  } catch (error) {
    console.error('[Mascot] Failed to load stored token:', error);
  }
})();

// Listen for messages from UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'init':
        // Initialize with auth token
        if (msg.token && msg.token.trim()) {
          apiClient = new MascotAPI(msg.token.trim());
          // Store token in clientStorage
          await figma.clientStorage.setAsync('mascot_token', msg.token.trim());
          console.log('[Mascot] Authenticated with API token');
        } else {
          rpc.send('error', { message: 'Invalid token. Please provide a valid API token.' });
          return;
        }
        rpc.send('init-complete', { success: true });
        break;

      case 'get-stored-token':
        // Send stored token to UI
        const token = await figma.clientStorage.getAsync('mascot_token');
        rpc.send('stored-token', { token: token || null });
        break;

      case 'get-figma-file-id':
        rpc.send('figma-file-id', { fileId: figma.fileKey || 'local' });
        break;

      case 'generate-mascot':
        await handleGenerateMascot(msg.data);
        break;

      case 'generate-animation':
        await handleGenerateAnimation(msg.data);
        break;

      case 'generate-logo-pack':
        await handleGenerateLogoPack(msg.data);
        break;

      case 'insert-image':
        await handleInsertImage(msg.data);
        break;

      case 'insert-frames':
        await handleInsertFrames(msg.data);
        break;

      case 'get-mascots':
        await handleGetMascots();
        break;

      default:
        rpc.send('error', { message: `Unknown message type: ${msg.type}` });
    }
  } catch (error) {
    handleError(error, 'message handler');
  }
};

async function handleGenerateMascot(data: {
  name: string;
  prompt: string;
  style: string;
  referenceImageUrl?: string;
}) {
  // Require authentication
  if (!apiClient) {
    rpc.send('error', { 
      message: 'Please sign in to generate mascots. Click "Sign In with API Token" to authenticate.' 
    });
    figma.notify('Please sign in to generate mascots');
    return;
  }

  const figmaFileId = figma.fileKey || 'local';
  rpc.send('mascot-generation-started', { name: data.name });

  try {
    const mascot = await apiClient.createMascot({
      name: data.name,
      prompt: data.prompt,
      style: data.style,
      referenceImageUrl: data.referenceImageUrl,
      figmaFileId,
    });

    rpc.send('mascot-generated', { mascot });

    // Auto-insert the full body image if available
    if (mascot.fullBodyImageUrl) {
      try {
        console.log('[Mascot] Auto-inserting mascot image:', mascot.fullBodyImageUrl);
        await insertImageFromUrl(mascot.fullBodyImageUrl, mascot.name);
        figma.notify(`✅ Mascot "${mascot.name}" inserted in Figma!`);
      } catch (error) {
        console.error('[Mascot] Failed to auto-insert image:', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        figma.notify(`⚠️ Mascot created but image insertion failed: ${errorMsg}`);
      }
    } else {
      console.warn('[Mascot] No fullBodyImageUrl in mascot response:', mascot);
      figma.notify(`⚠️ Mascot "${mascot.name}" created but no image URL available`);
    }
  } catch (error) {
    handleError(error, 'generate-mascot');
    rpc.send('mascot-generation-failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleGenerateAnimation(data: {
  mascotId: string;
  action: string;
  resolution?: number;
}) {
  // Demo mode: show message
  if (!apiClient) {
    rpc.send('animation-generation-started', {
      mascotId: data.mascotId,
      action: data.action,
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    rpc.send('error', { 
      message: 'Demo mode: Animation generation requires authentication. Sign in to generate real animations.' 
    });
    figma.notify('Demo mode: Sign in for real animation generation.');
    return;
  }

  const figmaFileId = figma.fileKey || 'local';

  rpc.send('animation-generation-started', {
    mascotId: data.mascotId,
    action: data.action,
  });

  try {
    const animation = await apiClient.createAnimation(data.mascotId, {
      action: data.action,
      resolution: data.resolution,
      figmaFileId,
    });

    rpc.send('animation-generated', { animation });

    // Poll for completion
    pollAnimationStatus(animation.id);
  } catch (error) {
    handleError(error, 'generate-animation');
    rpc.send('animation-generation-failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function pollAnimationStatus(animationId: string) {
  if (!apiClient) return;

  const maxAttempts = 60; // 5 minutes max
  let attempts = 0;

  const poll = async () => {
    if (attempts >= maxAttempts) {
      rpc.send('animation-generation-timeout', { animationId });
      return;
    }

    try {
      const status = await apiClient!.getAnimationStatus(animationId);

      rpc.send('animation-status-update', {
        animationId,
        status: status.status,
        progress: status.progress,
      });

      if (status.status === 'completed') {
        const animation = await apiClient!.getAnimation(animationId);
        rpc.send('animation-completed', { animation });

        // Optionally insert sprite sheet frames
        if (animation.spriteSheetUrl) {
          // Could insert frames here if needed
        }
      } else if (status.status === 'failed') {
        rpc.send('animation-generation-failed', {
          error: status.errorMessage || 'Generation failed',
        });
      } else {
        // Still processing, poll again
        setTimeout(poll, 5000); // Poll every 5 seconds
        attempts++;
      }
    } catch (error) {
      handleError(error, 'poll-animation-status');
    }
  };

  poll();
}

async function handleGenerateLogoPack(data: { mascotId: string; brandColors?: string[] }) {
  // Demo mode: show message
  if (!apiClient) {
    rpc.send('logo-pack-generation-started', { mascotId: data.mascotId });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    rpc.send('error', { 
      message: 'Demo mode: Logo pack generation requires authentication. Sign in to generate real logo packs.' 
    });
    figma.notify('Demo mode: Sign in for real logo generation.');
    return;
  }

  const figmaFileId = figma.fileKey || 'local';

  rpc.send('logo-pack-generation-started', { mascotId: data.mascotId });

  try {
    const logoPack = await apiClient.createLogoPack(data.mascotId, {
      brandColors: data.brandColors,
      figmaFileId,
    });

    rpc.send('logo-pack-generated', { logoPack });

    // Poll for completion
    pollLogoPackStatus(logoPack.id);
  } catch (error) {
    handleError(error, 'generate-logo-pack');
    rpc.send('logo-pack-generation-failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function pollLogoPackStatus(logoPackId: string) {
  if (!apiClient) return;

  const maxAttempts = 30; // 2.5 minutes max
  let attempts = 0;

  const poll = async () => {
    if (attempts >= maxAttempts) {
      rpc.send('logo-pack-generation-timeout', { logoPackId });
      return;
    }

    try {
      const logoPack = await apiClient!.getLogoPack(logoPackId);

      rpc.send('logo-pack-status-update', {
        logoPackId,
        status: logoPack.status,
      });

      if (logoPack.status === 'completed') {
        rpc.send('logo-pack-completed', { logoPack });
      } else if (logoPack.status === 'failed') {
        rpc.send('logo-pack-generation-failed', {
          error: logoPack.errorMessage || 'Generation failed',
        });
      } else {
        setTimeout(poll, 5000);
        attempts++;
      }
    } catch (error) {
      handleError(error, 'poll-logo-pack-status');
    }
  };

  poll();
}

async function handleInsertImage(data: { url: string; name: string }) {
  await insertImageFromUrl(data.url, data.name);
  rpc.send('image-inserted', { url: data.url });
}

async function insertImageFromUrl(url: string, name: string) {
  try {
    console.log('[Mascot] Inserting image from URL:', url.substring(0, 100) + (url.length > 100 ? '...' : ''));
    console.log('[Mascot] Image name:', name);
    
    // Check if we're on a page
    if (!figma.currentPage) {
      throw new Error('No page available. Please open a page in Figma.');
    }
    
    // Load image from URL (data URLs or regular URLs)
    const image = await figma.createImageAsync(url);
    console.log('[Mascot] Image loaded, hash:', image.hash);
    
    const node = figma.createRectangle();
    node.name = name;
    node.resize(512, 512); // Default size, user can resize
    node.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FIT' }];

    // Center on viewport
    const viewport = figma.viewport.center;
    node.x = viewport.x - 256;
    node.y = viewport.y - 256;

    figma.currentPage.appendChild(node);
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
    
    console.log('[Mascot] Image inserted successfully at:', node.x, node.y);
    figma.notify(`Image "${name}" inserted successfully!`);
  } catch (error) {
    console.error('[Mascot] Failed to insert image:', error);
    handleError(error, 'insert-image');
    rpc.send('error', {
      message: `Failed to insert image: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    figma.notify(`Failed to insert image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function handleInsertFrames(data: { urls: string[]; name: string }) {
  // Insert multiple images as frames (for sprite sheets)
  const frame = figma.createFrame();
  frame.name = data.name;
  frame.layoutMode = 'HORIZONTAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'AUTO';

  for (const url of data.urls) {
    try {
      const image = await figma.createImageAsync(url);
      const node = figma.createRectangle();
      node.resize(128, 128); // Default frame size
      node.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FIT' }];
      frame.appendChild(node);
    } catch (error) {
      console.error(`Failed to load frame: ${url}`, error);
    }
  }

  if (frame.children.length > 0) {
    const viewport = figma.viewport.center;
    frame.x = viewport.x - frame.width / 2;
    frame.y = viewport.y - frame.height / 2;

    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);
  }

  rpc.send('frames-inserted', { count: frame.children.length });
}

async function handleGetMascots() {
  // Demo mode: return empty list or mock data
  if (!apiClient) {
    rpc.send('mascots-loaded', { mascots: [] });
    return;
  }

  try {
    const figmaFileId = figma.fileKey || 'local';
    const mascots = await apiClient.getMascots({ figmaFileId });
    rpc.send('mascots-loaded', { mascots: mascots.data });
  } catch (error) {
    handleError(error, 'get-mascots');
    rpc.send('error', {
      message: error instanceof Error ? error.message : 'Failed to load mascots',
    });
  }
}

// Show UI on startup with error handling
try {
  console.log('[Mascot] Initializing plugin...');
  figma.showUI(__html__, {
    width: 320,
    height: 600,
    themeColors: true,
  });
  console.log('[Mascot] UI shown successfully');
  
  // Get Figma file ID on startup
  rpc.send('figma-file-id', { fileId: figma.fileKey || 'local' });
  console.log('[Mascot] Plugin initialized');
} catch (error) {
  console.error('[Mascot] Failed to initialize:', error);
  figma.notify('Failed to initialize plugin. Check console for details.');
}
