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
        console.log('[Mascot Code] Received init message');
        console.log('[Mascot Code] msg.type:', msg.type);
        console.log('[Mascot Code] msg.data:', msg.data);
        console.log('[Mascot Code] msg.token:', msg.token);
        
        // Try to get token from different possible locations
        let authToken = null;
        if (msg.data && msg.data.token) {
          authToken = msg.data.token;
        } else if (msg.token) {
          authToken = msg.token;
        }
        
        console.log('[Mascot Code] Token received:', authToken ? `${authToken.substring(0, 20)}...` : 'null');
        if (authToken && authToken.trim()) {
          const trimmedToken = authToken.trim();
          apiClient = new MascotAPI(trimmedToken);
          // Store token in clientStorage
          await figma.clientStorage.setAsync('mascot_token', trimmedToken);
          console.log('[Mascot Code] Authenticated with API token, apiClient created');
          console.log('[Mascot Code] apiClient is now:', apiClient ? 'INITIALIZED' : 'NULL');
        } else {
          console.error('[Mascot Code] Invalid token received');
          rpc.send('error', { message: 'Invalid token. Please provide a valid API token.' });
          return;
        }
        console.log('[Mascot Code] Sending init-complete');
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

      case 'open-google-auth':
        // Open Google OAuth URL in browser
        if (msg.data && msg.data.url) {
          figma.openExternal(msg.data.url);
          console.log('[Mascot Code] Opened Google OAuth URL:', msg.data.url);
        }
        break;

      case 'generate-mascot':
        await handleGenerateMascot(msg.data);
        break;

      case 'auto-fill':
        await handleAutoFill(msg.data);
        break;

      case 'generate-animation':
        await handleGenerateAnimation(msg.data);
        break;

      case 'generate-pose':
        await handleGeneratePose(msg.data);
        break;

      case 'generate-logo-pack':
        await handleGenerateLogoPack(msg.data);
        break;

      case 'insert-image':
        await handleInsertImage(msg.data);
        break;

      case 'insert-animation':
        await handleInsertAnimation(msg.data);
        break;

      case 'insert-frames':
        await handleInsertFrames(msg.data);
        break;

      case 'get-mascots':
        await handleGetMascots();
        break;

      case 'get-batch-variations':
        await handleGetBatchVariations(msg.data);
        break;

      case 'add-mascot-to-list':
        // Relay the message to UI (when variation is selected in CharacterTab)
        // The UI will handle adding it to the mascots list
        const mascot = msg.data && msg.data.mascot ? msg.data.mascot : null;
        console.log('[Mascot Code] Relaying add-mascot-to-list message:', mascot ? mascot.id : 'null');
        if (mascot) {
          rpc.send('add-mascot-to-list', { mascot: mascot });
        } else {
          console.error('[Mascot Code] Invalid mascot data in add-mascot-to-list:', msg.data);
        }
        break;

      case 'get-mascot-animations':
        await handleGetMascotAnimations(msg.data);
        break;

      case 'get-mascot-logos':
        await handleGetMascotLogos(msg.data);
        break;

      case 'delete-mascot':
        await handleDeleteMascot(msg.data);
        break;

      case 'delete-animation':
        await handleDeleteAnimation(msg.data);
        break;

      case 'delete-logo-pack':
        await handleDeleteLogoPack(msg.data);
        break;

      case 'delete-pose':
        await handleDeletePose(msg.data);
        break;

      default:
        rpc.send('error', { message: `Unknown message type: ${msg.type}` });
    }
  } catch (error) {
    handleError(error, 'message handler');
  }
};

async function handleGenerateMascot(data: any) {
  // Require authentication
  console.log('[Mascot Code] handleGenerateMascot called');
  console.log('[Mascot Code] apiClient status:', apiClient ? 'INITIALIZED' : 'NULL');
  if (!apiClient) {
    console.error('[Mascot Code] No apiClient, user not authenticated');
    rpc.send('error', { 
      message: 'Please sign in to generate mascots. Click "Sign In with API Token" to authenticate.' 
    });
    figma.notify('Please sign in to generate mascots');
    return;
  }
  console.log('[Mascot Code] apiClient OK, proceeding with generation');

  const figmaFileId = figma.fileKey || 'local';
  rpc.send('mascot-generation-started', { name: data.name });

  try {
    const variations = await apiClient.createMascot({
      name: data.name,
      prompt: data.prompt,
      style: data.style,
      type: data.type,
      personality: data.personality,
      negativePrompt: data.negativePrompt,
      accessories: data.accessories,
      brandColors: data.brandColors,
      autoFillUrl: data.autoFillUrl,
      referenceImageUrl: data.referenceImageUrl,
      numVariations: data.numVariations || 3,
      figmaFileId,
    });

    console.log('[Mascot] Generated variations:', variations);

    // Send all variations to UI
    rpc.send('mascot-generated', { 
      mascot: variations[0],
      variations: variations 
    });

    figma.notify(`✅ Generated ${variations.length} variation(s)! Select one in the plugin.`);
  } catch (error) {
    handleError(error, 'generate-mascot');
    rpc.send('mascot-generation-failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function handleAutoFill(data: { url: string }) {
  if (!apiClient) {
    rpc.send('auto-fill-failed', { 
      error: 'Please sign in to use auto-fill.' 
    });
    figma.notify('Please sign in to use auto-fill');
    return;
  }

  try {
    const result = await apiClient.autoFill({ url: data.url });
    rpc.send('auto-fill-complete', result);
    figma.notify('✅ Auto-filled from URL!');
  } catch (error) {
    handleError(error, 'auto-fill');
    rpc.send('auto-fill-failed', {
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

async function handleGeneratePose(data: { mascotId: string; prompt: string }) {
  if (!apiClient) {
    rpc.send('error', { 
      message: 'Please sign in to generate poses. Click "Sign In with API Token" to authenticate.' 
    });
    figma.notify('Please sign in to generate poses');
    return;
  }

  const figmaFileId = figma.fileKey || 'local';
  rpc.send('pose-generation-started', { 
    mascotId: data.mascotId,
    prompt: data.prompt 
  });

  try {
    console.log(`[Mascot Code] Generating pose with prompt: "${data.prompt}" for mascot ${data.mascotId}`);
    
    const pose = await apiClient.createPose(data.mascotId, {
      prompt: data.prompt,
      figmaFileId,
    });

    rpc.send('pose-generated', { pose });

    // Poll for completion
    pollPoseStatus(pose.id);
  } catch (error) {
    handleError(error, 'generate-pose');
    rpc.send('pose-generation-failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function pollPoseStatus(poseId: string) {
  if (!apiClient) return;

  const maxAttempts = 60; // 5 minutes max
  let attempts = 0;

  const poll = async () => {
    if (attempts >= maxAttempts) {
      rpc.send('pose-generation-timeout', { poseId });
      return;
    }

    try {
      const status = await apiClient!.getPoseStatus(poseId);

      rpc.send('pose-status-update', {
        poseId,
        status: status.status,
      });

      if (status.status === 'completed') {
        const pose = await apiClient!.getPose(poseId);
        try {
          const imageDataUrl = await apiClient!.getPoseImageDataUrl(poseId);
          rpc.send('pose-completed', { pose: { ...pose, imageDataUrl } });
        } catch (imgErr) {
          rpc.send('pose-completed', { pose });
        }
      } else if (status.status === 'failed') {
        rpc.send('pose-generation-failed', {
          error: status.errorMessage || 'Generation failed',
        });
      } else {
        // Still processing, poll again
        setTimeout(poll, 5000); // Poll every 5 seconds
        attempts++;
      }
    } catch (error) {
      handleError(error, 'poll-pose-status');
    }
  };

  poll();
}

async function handleGenerateLogoPack(data: {
  mascotId: string;
  brandColors?: string[];
  imageSource?: 'fullBody' | 'avatar' | 'squareIcon';
  background?: 'transparent' | 'white' | 'brand';
  referenceLogoUrl?: string;
}) {
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
    // Omit imageSource/background until backend is deployed with CreateLogoPackDto that accepts them (avoids 400 "property should not exist")
    const logoPack = await apiClient.createLogoPack(data.mascotId, {
      brandColors: data.brandColors,
      referenceLogoUrl: data.referenceLogoUrl,
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
  try {
    await insertImageFromUrl(data.url, data.name);
    rpc.send('image-inserted', { url: data.url });
  } catch (_) {
    // Error already sent by insertImageFromUrl
  }
}

async function handleInsertAnimation(data: { animationId: string; animation: any }) {
  const { animation } = data;
  
  console.log('[Mascot Code] Inserting animation:', animation.id, animation.action);
  
  try {
    // Figma doesn't support videos directly, so we insert the sprite sheet
    // or the first frame if sprite sheet is not available
    
    if (!figma.currentPage) {
      throw new Error('No page available. Please open a page in Figma.');
    }

    let imageUrl: string | null = null;
    let name = `Animation: ${animation.action || 'animation'}`;

    // Priority: sprite sheet > first frame from metadata > placeholder
    if (animation.spriteSheetUrl) {
      imageUrl = animation.spriteSheetUrl;
      name = `${animation.action || 'Animation'} - Sprite Sheet`;
      console.log('[Mascot Code] Using sprite sheet for animation');
    } else if (animation.metadata && animation.metadata.frameUrls && animation.metadata.frameUrls.length > 0) {
      // Use first frame if sprite sheet not available
      imageUrl = animation.metadata.frameUrls[0];
      name = `${animation.action || 'Animation'} - Frame 1`;
      console.log('[Mascot Code] Using first frame for animation');
    } else {
      throw new Error('Animation has no sprite sheet or frames available');
    }

    if (!imageUrl) {
      throw new Error('No image URL available for animation');
    }

    // Insert the sprite sheet or first frame
    await insertImageFromUrl(imageUrl, name);
    
    // Also store animation metadata for reference
    figma.notify(`✅ Animation "${animation.action}" inserted! (Sprite sheet)`);
    rpc.send('animation-inserted', { animationId: animation.id });
    
  } catch (error) {
    console.error('[Mascot Code] Failed to insert animation:', error);
    handleError(error, 'insert-animation');
    rpc.send('error', {
      message: `Failed to insert animation: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    figma.notify(`Failed to insert animation: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
    const msg = error instanceof Error ? error.message : 'Unknown error';
    handleError(error, 'insert-image');
    rpc.send('error', { message: `Failed to insert image: ${msg}`, context: 'insert-image' });
    figma.notify(`Failed to insert image: ${msg}`);
    throw error;
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

async function handleGetBatchVariations(data: { batchId: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Not authenticated' });
    return;
  }

  try {
    console.log('[Mascot Code] Fetching batch variations for batchId:', data.batchId);
    const variations = await apiClient.getBatchVariations(data.batchId);
    console.log('[Mascot Code] Received variations:', variations.length);
    
    // Log detailed info about each variation
    variations.forEach((v, idx) => {
      const hasImage = !!(v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl);
      console.log(`[Mascot Code] Variation ${idx + 1} (${v.id}):`, {
        variationIndex: v.variationIndex,
        status: v.status,
        hasImage,
        fullBody: v.fullBodyImageUrl ? 'yes' : 'no',
        avatar: v.avatarImageUrl ? 'yes' : 'no',
        image: v.imageUrl ? 'yes' : 'no'
      });
    });
    
    const withImages = variations.filter(v => v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl).length;
    console.log('[Mascot Code] Variations with images:', withImages, '/', variations.length);
    
    rpc.send('batch-variations-loaded', { variations });
  } catch (error) {
    console.error('[Mascot Code] Error fetching batch variations:', error);
    handleError(error, 'get-batch-variations');
    rpc.send('error', {
      message: error instanceof Error ? error.message : 'Failed to load variations',
    });
  }
}

async function handleGetMascots() {
  // Demo mode: return empty list or mock data
  if (!apiClient) {
    console.log('[Mascot Code] No API client, returning empty mascots list');
    rpc.send('mascots-loaded', { mascots: [] });
    return;
  }

  try {
    console.log('[Mascot Code] Fetching mascots from API...');
    // Don't filter by figmaFileId - get all mascots for this user
    // Request multiple pages to get all mascots
    const allMascots: any[] = [];
    let page = 1;
    const limit = 50; // Get more per page
    
    while (true) {
      const response = await apiClient.getMascots({ page, limit });
      const mascotsData = response.data || [];
      allMascots.push(...mascotsData);
      
      console.log(`[Mascot Code] Fetched page ${page}:`, mascotsData.length, 'mascots');
      
      // If we got fewer than limit, we've reached the end
      if (mascotsData.length < limit || page >= 10) { // Safety limit of 10 pages
        break;
      }
      page++;
    }
    
    console.log('[Mascot Code] Received total mascots from API:', allMascots.length);
    
    // Log first mascot safely
    if (allMascots.length > 0 && allMascots[0]) {
      const firstMascot = allMascots[0];
      console.log('[Mascot Code] First mascot sample:', {
        id: firstMascot.id || 'no-id',
        name: firstMascot.name || 'no-name',
        hasFullBody: !!firstMascot.fullBodyImageUrl,
        hasAvatar: !!firstMascot.avatarImageUrl,
        hasImage: !!firstMascot.imageUrl
      });
    }
    
    // Send mascots to UI - this should never fail
    console.log('[Mascot Code] Sending mascots-loaded with', allMascots.length, 'mascots');
    rpc.send('mascots-loaded', { mascots: allMascots });
    console.log('[Mascot Code] Successfully sent mascots-loaded message');
  } catch (error) {
    console.error('[Mascot Code] Error loading mascots:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Mascot Code] Error details:', errorMessage);
    handleError(error, 'get-mascots');
    rpc.send('error', {
      message: errorMessage,
    });
    // Still send empty array so UI doesn't hang
    rpc.send('mascots-loaded', { mascots: [] });
  }
}

async function handleGetMascotAnimations(data: { mascotId: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Not authenticated' });
    return;
  }

  try {
    console.log('[Mascot Code] Fetching animations for mascot:', data.mascotId);
    const animations = await apiClient.getMascotAnimations(data.mascotId);
    // Ensure animations is an array
    const animationsArray = Array.isArray(animations) ? animations : [];
    console.log('[Mascot Code] Received animations:', animationsArray.length);
    rpc.send('mascot-animations-loaded', { mascotId: data.mascotId, animations: animationsArray });
  } catch (error) {
    console.error('[Mascot Code] Error loading animations:', error);
    handleError(error, 'get-mascot-animations');
    rpc.send('mascot-animations-loaded', { mascotId: data.mascotId, animations: [] });
  }
}

async function handleGetMascotLogos(data: { mascotId: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Not authenticated' });
    return;
  }

  try {
    console.log('[Mascot Code] Fetching logos for mascot:', data.mascotId);
    const logos = await apiClient.getMascotLogoPacks(data.mascotId);
    // Ensure logos is an array
    const logosArray = Array.isArray(logos) ? logos : [];
    console.log('[Mascot Code] Received logos:', logosArray.length);
    rpc.send('mascot-logos-loaded', { mascotId: data.mascotId, logos: logosArray });
  } catch (error) {
    console.error('[Mascot Code] Error loading logos:', error);
    handleError(error, 'get-mascot-logos');
    rpc.send('mascot-logos-loaded', { mascotId: data.mascotId, logos: [] });
  }
}

async function handleDeleteMascot(data: { id: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Not authenticated' });
    return;
  }

  try {
    console.log('[Mascot Code] Deleting mascot:', data.id);
    await apiClient.deleteMascot(data.id);
    figma.notify('Mascot deleted successfully');
    rpc.send('mascot-deleted', { id: data.id });
    // Reload mascots list
    await handleGetMascots();
  } catch (error) {
    handleError(error, 'delete-mascot');
    rpc.send('delete-failed', { id: data.id, type: 'mascot' });
  }
}

async function handleDeleteAnimation(data: { id: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Not authenticated' });
    return;
  }

  try {
    console.log('[Mascot Code] Deleting animation:', data.id);
    await apiClient.deleteAnimation(data.id);
    figma.notify('Animation deleted successfully');
    rpc.send('animation-deleted', { id: data.id });
  } catch (error) {
    handleError(error, 'delete-animation');
    rpc.send('delete-failed', { id: data.id, type: 'animation' });
  }
}

async function handleDeleteLogoPack(data: { id: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Not authenticated' });
    return;
  }

  try {
    console.log('[Mascot Code] Deleting logo pack:', data.id);
    await apiClient.deleteLogoPack(data.id);
    figma.notify('Logo pack deleted successfully');
    rpc.send('logo-pack-deleted', { id: data.id });
  } catch (error) {
    handleError(error, 'delete-logo-pack');
    rpc.send('delete-failed', { id: data.id, type: 'logo-pack' });
  }
}

async function handleDeletePose(data: { id: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Not authenticated' });
    return;
  }

  try {
    console.log('[Mascot Code] Deleting pose:', data.id);
    await apiClient.deletePose(data.id);
    figma.notify('Pose deleted successfully');
    rpc.send('pose-deleted', { id: data.id });
  } catch (error) {
    handleError(error, 'delete-pose');
    rpc.send('delete-failed', { id: data.id, type: 'pose' });
  }
}

// Show UI on startup with error handling
try {
  console.log('[Mascot] Initializing plugin...');
  figma.showUI(__html__, {
    width: 500,
    height: 700,
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
