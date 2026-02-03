// This file runs in the Figma plugin sandbox (not in the UI iframe)

import { MascotAPI } from './api/client';
import { RPC } from './rpc/rpc';

// Initialize RPC bridge
const rpc = new RPC();

// Initialize API client (will be set when user authenticates)
let apiClient: MascotAPI | null = null;

// Error handling wrapper: extract a string message (avoid "[object Object]")
function handleError(error: any, context: string) {
  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.response?.data?.message) {
    const m = error.response.data.message;
    errorMessage = typeof m === 'string' ? m : Array.isArray(m) ? m[0] : JSON.stringify(m);
  } else if (error?.message) {
    errorMessage = typeof error.message === 'string' ? error.message : String(error.message);
  } else {
    errorMessage = typeof error === 'object' ? (error.message || error.error || JSON.stringify(error)) : String(error);
  }
  if (!errorMessage || errorMessage === '[object Object]') {
    errorMessage = 'Request failed';
  }
  console.error(`[Mascoty Error in ${context}]:`, errorMessage);
  rpc.send('error', {
    message: errorMessage,
    context,
  });
}

function getErrorMessage(error: any): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) {
    const m = error.response.data.message;
    return typeof m === 'string' ? m : Array.isArray(m) ? m[0] : String(m);
  }
  if (error?.message) return typeof error.message === 'string' ? error.message : String(error.message);
  return typeof error === 'object' ? (error.message || error.error || 'Request failed') : String(error);
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
    console.error('[Mascoty] Failed to load stored token:', error);
  }
})();

// Listen for messages from UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'init':
        // Initialize with auth token and validate against backend
        console.log('[Mascoty Code] Received init message');
        let authToken: string | null = null;
        if (msg.data && msg.data.token) {
          authToken = msg.data.token;
        } else if (msg.token) {
          authToken = msg.token;
        }
        if (!authToken || !authToken.trim()) {
          rpc.send('init-failed', { message: 'Please enter your API token.' });
          return;
        }
        const trimmedToken = authToken.trim();
        apiClient = new MascotAPI(trimmedToken);
        try {
          await apiClient.getCredits();
        } catch (err) {
          const message = getErrorMessage(err) || 'Invalid or expired token. Please check your API token.';
          console.error('[Mascoty Code] Token validation failed:', message);
          apiClient = null;
          await figma.clientStorage.deleteAsync('mascot_token');
          rpc.send('init-failed', { message });
          return;
        }
        await figma.clientStorage.setAsync('mascot_token', trimmedToken);
        console.log('[Mascoty Code] Token validated, sending init-complete');
        rpc.send('init-complete', { success: true });
        break;

      case 'get-stored-token':
        // Send stored token to UI
        const token = await figma.clientStorage.getAsync('mascot_token');
        rpc.send('stored-token', { token: token || null });
        break;

      case 'logout':
        await figma.clientStorage.deleteAsync('mascot_token');
        apiClient = null;
        rpc.send('logout-complete', {});
        break;

      case 'get-figma-file-id':
        rpc.send('figma-file-id', { fileId: figma.fileKey || 'local' });
        break;

      case 'open-google-auth':
        // Open Google OAuth URL in browser
        if (msg.data && msg.data.url) {
          figma.openExternal(msg.data.url);
          console.log('[Mascoty Code] Opened Google OAuth URL:', msg.data.url);
        }
        break;

      case 'open-url':
        if (msg.data && msg.data.url) {
          figma.openExternal(msg.data.url);
        }
        break;

      case 'auth-login':
        await handleAuthLogin(msg.data);
        break;

      case 'auth-register':
        await handleAuthRegister(msg.data);
        break;

      case 'auth-exchange-code':
        await handleAuthExchangeCode(msg.data);
        break;

      case 'generate-mascot':
        await handleGenerateMascot(msg.data);
        break;

      case 'auto-fill':
        await handleAutoFill(msg.data);
        break;

      case 'generate-pose':
        await handleGeneratePose(msg.data);
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

      case 'get-credits':
        await handleGetCredits();
        break;

      case 'get-batch-variations':
        await handleGetBatchVariations(msg.data);
        break;

      case 'add-mascot-to-list':
        // Relay the message to UI (when variation is selected in CharacterTab)
        // The UI will handle adding it to the mascots list
        const mascot = msg.data && msg.data.mascot ? msg.data.mascot : null;
        console.log('[Mascoty Code] Relaying add-mascot-to-list message:', mascot ? mascot.id : 'null');
        if (mascot) {
          rpc.send('add-mascot-to-list', { mascot: mascot });
        } else {
          console.error('[Mascoty Code] Invalid mascot data in add-mascot-to-list:', msg.data);
        }
        break;

      case 'get-mascot-poses':
        await handleGetMascotPoses(msg.data);
        break;

      case 'export-selection-and-upload':
        await handleExportSelectionAndUpload();
        break;

      case 'create-mascot-from-image-url':
        await handleCreateMascotFromImageUrl(msg.data);
        break;

      case 'upload-image-and-create-mascot':
        await handleUploadImageAndCreateMascot(msg.data);
        break;

      case 'delete-mascot':
        await handleDeleteMascot(msg.data);
        break;

      case 'delete-pose':
        await handleDeletePose(msg.data);
        break;

      case 'create-checkout':
        await handleCreateCheckout(msg.data);
        break;

      case 'create-portal':
        await handleCreatePortal();
        break;

      default:
        rpc.send('error', { message: `Unknown message type: ${msg.type}` });
    }
  } catch (error) {
    handleError(error, 'message handler');
  }
};

async function handleAuthLogin(data: { email: string; password: string }) {
  const email = data?.email?.trim();
  const password = data?.password;
  if (!email || !password) {
    rpc.send('init-failed', { message: 'Please enter your email and password.' });
    return;
  }
  try {
    const auth = await MascotAPI.login(email, password);
    const token = auth?.accessToken;
    if (!token) {
      rpc.send('init-failed', { message: 'Login succeeded but no token received.' });
      return;
    }
    apiClient = new MascotAPI(token);
    await figma.clientStorage.setAsync('mascot_token', token);
    rpc.send('init-complete', { success: true });
  } catch (err) {
    const message = getErrorMessage(err) || 'Invalid email or password.';
    rpc.send('init-failed', { message });
  }
}

async function handleAuthRegister(data: {
  email: string;
  password: string;
  name?: string;
}) {
  const email = data?.email?.trim();
  const password = data?.password;
  if (!email || !password) {
    rpc.send('init-failed', { message: 'Please enter your email and password.' });
    return;
  }
  if (password.length < 8) {
    rpc.send('init-failed', { message: 'Password must be at least 8 characters.' });
    return;
  }
  try {
    const auth = await MascotAPI.register(email, password, data?.name);
    const token = auth?.accessToken;
    if (!token) {
      rpc.send('init-failed', { message: 'Registration succeeded but no token received.' });
      return;
    }
    apiClient = new MascotAPI(token);
    await figma.clientStorage.setAsync('mascot_token', token);
    rpc.send('init-complete', { success: true });
  } catch (err) {
    const message = getErrorMessage(err) || 'Registration failed. Try another email.';
    rpc.send('init-failed', { message });
  }
}

async function handleAuthExchangeCode(data: { code: string }) {
  const code = data?.code?.trim();
  if (!code) {
    rpc.send('init-failed', { message: 'Please enter the 6-digit code.' });
    return;
  }
  try {
    const auth = await MascotAPI.exchangeCode(code);
    const token = auth?.accessToken;
    if (!token) {
      rpc.send('init-failed', { message: 'Invalid code. Please try again.' });
      return;
    }
    apiClient = new MascotAPI(token);
    await figma.clientStorage.setAsync('mascot_token', token);
    rpc.send('init-complete', { success: true });
  } catch (err) {
    const message = getErrorMessage(err) || 'Invalid or expired code. Please sign in again.';
    rpc.send('init-failed', { message });
  }
}

async function handleGenerateMascot(data: any) {
  // Require authentication
  console.log('[Mascoty Code] handleGenerateMascot called');
  console.log('[Mascoty Code] apiClient status:', apiClient ? 'INITIALIZED' : 'NULL');
  if (!apiClient) {
    console.error('[Mascoty Code] No apiClient, user not authenticated');
    rpc.send('error', { 
      message: 'Please sign in to generate mascots. Click "Sign In with API Token" to authenticate.' 
    });
    figma.notify('Please sign in to generate mascots');
    return;
  }
  console.log('[Mascoty Code] apiClient OK, proceeding with generation');

  const figmaFileId = figma.fileKey || 'local';
  rpc.send('mascot-generation-started', { name: data.name });

  try {
    const variations = await apiClient.createMascot({
      name: data.name,
      prompt: data.prompt,
      custom: data.style,
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

    console.log('[Mascoty] Generated variations:', variations);

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
    console.log(`[Mascoty Code] Generating pose with prompt: "${data.prompt}" for mascot ${data.mascotId}`);
    
    const pose = await apiClient.createPose(data.mascotId, {
      prompt: data.prompt,
      figmaFileId,
      color: data.color,
      negativePrompt: data.negativePrompt,
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
      const statusRes = await apiClient!.getPoseStatus(poseId);
      const statusStr = typeof statusRes?.status === 'string' ? statusRes.status.toLowerCase() : '';

      rpc.send('pose-status-update', {
        poseId,
        status: statusRes?.status ?? statusStr,
      });

      if (statusStr === 'completed') {
        // Short delay so backend has finished persisting imageUrl and storage (after rembg)
        await new Promise((r) => setTimeout(r, 800));
        const pose = await apiClient!.getPose(poseId);
        try {
          const imageDataUrl = await apiClient!.getPoseImageDataUrl(poseId);
          rpc.send('pose-completed', { pose: Object.assign({}, pose, { status: 'completed', imageDataUrl }) });
        } catch (imgErr) {
          rpc.send('pose-completed', { pose: Object.assign({}, pose, { status: 'completed' }) });
        }
        return;
      }
      if (statusStr === 'failed') {
        rpc.send('pose-generation-failed', {
          error: statusRes?.errorMessage || 'Generation failed',
        });
        return;
      }
      // Still processing, poll again
      attempts++;
      setTimeout(poll, 3000); // Poll every 3 seconds
    } catch (error) {
      handleError(error, 'poll-pose-status');
      attempts++;
      setTimeout(poll, 5000);
    }
  };

  poll();
}

async function handleInsertImage(data: { url: string; name: string; width?: number; height?: number }) {
  try {
    await insertImageFromUrl(data.url, data.name, data.width, data.height);
    rpc.send('image-inserted', { url: data.url });
  } catch (_) {
    // Error already sent by insertImageFromUrl
  }
}

async function insertImageFromUrl(url: string, name: string, width?: number, height?: number) {
  try {
    console.log('[Mascoty] Inserting image from URL:', url.substring(0, 100) + (url.length > 100 ? '...' : ''));
    console.log('[Mascoty] Image name:', name, 'size:', width ?? 512, 'x', height ?? 512);
    
    // Check if we're on a page
    if (!figma.currentPage) {
      throw new Error('No page available. Please open a page in Figma.');
    }
    
    const w = width ?? 512;
    const h = height ?? 512;
    
    // Load image from URL (data URLs or regular URLs)
    const image = await figma.createImageAsync(url);
    console.log('[Mascoty] Image loaded, hash:', image.hash);
    
    const node = figma.createRectangle();
    node.name = name;
    node.resize(w, h);
    node.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FIT' }];

    // Center on viewport
    const viewport = figma.viewport.center;
    node.x = viewport.x - w / 2;
    node.y = viewport.y - h / 2;

    figma.currentPage.appendChild(node);
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
    
    console.log('[Mascoty] Image inserted successfully at:', node.x, node.y);
    figma.notify(`Image "${name}" inserted successfully!`);
  } catch (error) {
    console.error('[Mascoty] Failed to insert image:', error);
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
    console.log('[Mascoty Code] Fetching batch variations for batchId:', data.batchId);
    const variations = await apiClient.getBatchVariations(data.batchId);
    console.log('[Mascoty Code] Received variations:', variations.length);
    
    // Log detailed info about each variation
    variations.forEach((v, idx) => {
      const hasImage = !!(v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl);
      console.log(`[Mascoty Code] Variation ${idx + 1} (${v.id}):`, {
        variationIndex: v.variationIndex,
        status: v.status,
        hasImage,
        fullBody: v.fullBodyImageUrl ? 'yes' : 'no',
        avatar: v.avatarImageUrl ? 'yes' : 'no',
        image: v.imageUrl ? 'yes' : 'no'
      });
    });
    
    const withImages = variations.filter(v => v.fullBodyImageUrl || v.avatarImageUrl || v.imageUrl).length;
    console.log('[Mascoty Code] Variations with images:', withImages, '/', variations.length);
    
    rpc.send('batch-variations-loaded', { variations });
  } catch (error) {
    console.error('[Mascoty Code] Error fetching batch variations:', error);
    handleError(error, 'get-batch-variations');
    rpc.send('error', {
      message: error instanceof Error ? error.message : 'Failed to load variations',
    });
  }
}

/** Convert Uint8Array to base64 for image upload (Figma plugin has btoa). */
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function handleExportSelectionAndUpload() {
  if (!apiClient) {
    rpc.send('error', { message: 'Please sign in to upload an image.', context: 'create-from-image' });
    figma.notify('Please sign in first');
    return;
  }

  const selection = figma.currentPage.selection;
  if (!selection || selection.length === 0) {
    rpc.send('error', { message: 'Select a frame or image on the canvas first.', context: 'create-from-image' });
    figma.notify('Select something on the canvas');
    return;
  }
  if (selection.length > 1) {
    rpc.send('error', { message: 'Select only one frame or image.', context: 'create-from-image' });
    figma.notify('Select only one element');
    return;
  }

  const node = selection[0];
  if (!('exportAsync' in node)) {
    rpc.send('error', { message: 'Selected node cannot be exported as image.', context: 'create-from-image' });
    figma.notify('Select a frame or image');
    return;
  }

  rpc.send('create-from-image-started', {});

  try {
    const bytes = await (node as any).exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
    const base64 = uint8ArrayToBase64(bytes);
    const { url } = await apiClient.uploadImage(base64);
    const mascot = await apiClient.createMascotFromImage(url, node.name || 'Uploaded visual');
    rpc.send('create-from-image-complete', { mascot });
    rpc.send('add-mascot-to-list', { mascot });
    figma.notify('Image uploaded and added as mascot');
  } catch (error) {
    handleError(error, 'create-from-image');
  }
}

async function handleCreateMascotFromImageUrl(data: { imageUrl?: string; name?: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Please sign in to use an image URL.', context: 'create-from-image' });
    figma.notify('Please sign in first');
    return;
  }

  const imageUrl = (data && data.imageUrl && typeof data.imageUrl === 'string') ? data.imageUrl.trim() : '';
  if (!imageUrl) {
    rpc.send('error', { message: 'Please enter an image URL.', context: 'create-from-image' });
    return;
  }

  const name = (data && data.name && typeof data.name === 'string') ? data.name.trim() : undefined;

  rpc.send('create-from-image-started', {});

  try {
    const mascot = await apiClient.createMascotFromImage(imageUrl, name || undefined);
    rpc.send('create-from-image-complete', { mascot });
    rpc.send('add-mascot-to-list', { mascot });
    figma.notify('Image added as mascot');
  } catch (error) {
    handleError(error, 'create-from-image');
  }
}

async function handleUploadImageAndCreateMascot(data: { base64?: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Please sign in to upload an image.', context: 'create-from-image' });
    figma.notify('Please sign in first');
    return;
  }

  const base64 = (data && data.base64 && typeof data.base64 === 'string') ? data.base64.trim() : '';
  if (!base64) {
    rpc.send('error', { message: 'No image data.', context: 'create-from-image' });
    return;
  }

  rpc.send('create-from-image-started', {});

  try {
    const { url } = await apiClient.uploadImage(base64);
    const mascot = await apiClient.createMascotFromImage(url, 'Uploaded visual');
    rpc.send('create-from-image-complete', { mascot });
    rpc.send('add-mascot-to-list', { mascot });
    figma.notify('Image uploaded and added as mascot');
  } catch (error) {
    handleError(error, 'create-from-image');
  }
}

async function handleGetMascots() {
  // Demo mode: return empty list or mock data
  if (!apiClient) {
    console.log('[Mascoty Code] No API client, returning empty mascots list');
    rpc.send('mascots-loaded', { mascots: [] });
    return;
  }

  try {
    console.log('[Mascoty Code] Fetching mascots from API...');
    // Don't filter by figmaFileId - get all mascots for this user
    // Request multiple pages to get all mascots
    const allMascots: any[] = [];
    let page = 1;
    const limit = 50; // Get more per page
    
    while (true) {
      const response = await apiClient.getMascots({ page, limit });
      const mascotsData = response.data || [];
      allMascots.push.apply(allMascots, mascotsData);
      
      console.log(`[Mascoty Code] Fetched page ${page}:`, mascotsData.length, 'mascots');
      
      // If we got fewer than limit, we've reached the end
      if (mascotsData.length < limit || page >= 10) { // Safety limit of 10 pages
        break;
      }
      page++;
    }
    
    console.log('[Mascoty Code] Received total mascots from API:', allMascots.length);
    
    // Log first mascot safely
    if (allMascots.length > 0 && allMascots[0]) {
      const firstMascot = allMascots[0];
      console.log('[Mascoty Code] First mascot sample:', {
        id: firstMascot.id || 'no-id',
        name: firstMascot.name || 'no-name',
        hasFullBody: !!firstMascot.fullBodyImageUrl,
        hasAvatar: !!firstMascot.avatarImageUrl,
        hasImage: !!firstMascot.imageUrl
      });
    }
    
    // Send mascots to UI on next tick so UI has registered handlers (avoids "No handlers" after OAuth)
    console.log('[Mascoty Code] Sending mascots-loaded with', allMascots.length, 'mascots');
    setTimeout(() => {
      rpc.send('mascots-loaded', { mascots: allMascots });
      console.log('[Mascoty Code] Successfully sent mascots-loaded message');
    }, 0);
  } catch (error) {
    console.error('[Mascoty Code] Error loading mascots:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Mascoty Code] Error details:', errorMessage);
    handleError(error, 'get-mascots');
    rpc.send('error', {
      message: errorMessage,
    });
    // Still send empty array so UI doesn't hang
    rpc.send('mascots-loaded', { mascots: [] });
  }
}

async function handleGetCredits() {
  if (!apiClient) {
    setTimeout(() => rpc.send('credits-balance', { balance: null, subscriptionPlanId: null }), 0);
    return;
  }
  try {
    const result = await apiClient.getCredits();
    const payload = {
      balance: result?.balance ?? null,
      plan: result?.plan,
      subscriptionPlanId: result?.subscriptionPlanId ?? null,
      monthlyAllowance: result?.monthlyAllowance,
    };
    setTimeout(() => rpc.send('credits-balance', payload), 0);
  } catch (error) {
    console.error('[Mascoty Code] Error loading credits:', error);
    setTimeout(() => rpc.send('credits-balance', { balance: null, subscriptionPlanId: null }), 0);
  }
}

async function handleCreateCheckout(data: { plan?: string }) {
  if (!apiClient) {
    rpc.send('checkout-error', { message: 'Please sign in first.' });
    return;
  }
  const plan = data?.plan ?? 'pro';
  try {
    const result = await apiClient.createCheckout(plan);
    if (result?.checkoutUrl) {
      rpc.send('checkout-url', { url: result.checkoutUrl });
    } else {
      rpc.send('checkout-error', { message: 'No checkout URL returned.' });
    }
  } catch (error) {
    const msg = getErrorMessage(error);
    console.error('[Mascoty Code] Checkout error:', msg);
    rpc.send('checkout-error', { message: msg });
  }
}

async function handleCreatePortal() {
  if (!apiClient) {
    rpc.send('portal-error', { message: 'Please sign in first.' });
    return;
  }
  try {
    const result = await apiClient.createBillingPortalSession();
    if (result?.url) {
      rpc.send('portal-url', { url: result.url });
    } else {
      rpc.send('portal-error', { message: 'Could not open billing page.' });
    }
  } catch (error) {
    const msg = getErrorMessage(error);
    console.error('[Mascoty Code] Portal error:', msg);
    rpc.send('portal-error', { message: msg });
  }
}

async function handleGetMascotPoses(data: { mascotId: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Not authenticated' });
    return;
  }

  try {
    console.log('[Mascoty Code] Fetching poses for mascot:', data.mascotId);
    const poses = await apiClient.getMascotPoses(data.mascotId);
    const posesArray = Array.isArray(poses) ? poses : [];
    console.log('[Mascoty Code] Received poses:', posesArray.length);
    rpc.send('mascot-poses-loaded', { mascotId: data.mascotId, poses: posesArray });
  } catch (error) {
    console.error('[Mascoty Code] Error loading poses:', error);
    handleError(error, 'get-mascot-poses');
    rpc.send('mascot-poses-loaded', { mascotId: data.mascotId, poses: [] });
  }
}

async function handleDeleteMascot(data: { id: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Not authenticated' });
    return;
  }

  try {
    console.log('[Mascoty Code] Deleting mascot:', data.id);
    await apiClient.deleteMascot(data.id);
    figma.notify('Mascot deleted successfully');
    rpc.send('mascot-deleted', { id: data.id });
    // Reload mascots list
    await handleGetMascots();
  } catch (error) {
    const msg = getErrorMessage(error);
    handleError(error, 'delete-mascot');
    figma.notify(`Delete failed: ${msg}`, { error: true });
    rpc.send('delete-failed', { id: data.id, type: 'mascot', message: msg });
  }
}

async function handleDeletePose(data: { id: string }) {
  if (!apiClient) {
    rpc.send('error', { message: 'Not authenticated' });
    return;
  }

  try {
    console.log('[Mascoty Code] Deleting pose:', data.id);
    await apiClient.deletePose(data.id);
    figma.notify('Pose deleted successfully');
    rpc.send('pose-deleted', { id: data.id });
  } catch (error) {
    const msg = getErrorMessage(error);
    handleError(error, 'delete-pose');
    figma.notify(`Delete failed: ${msg}`, { error: true });
    rpc.send('delete-failed', { id: data.id, type: 'pose', message: msg });
  }
}

// Show UI on startup with error handling
try {
  console.log('[Mascoty] Initializing plugin...');
  figma.showUI(__html__, {
    width: 500,
    height: 700,
    themeColors: true,
  });
  console.log('[Mascoty] UI shown successfully');
  
  // Get Figma file ID on startup
  rpc.send('figma-file-id', { fileId: figma.fileKey || 'local' });
  console.log('[Mascoty] Plugin initialized');
} catch (error) {
  console.error('[Mascoty] Failed to initialize:', error);
  figma.notify('Failed to initialize plugin. Check console for details.');
}
