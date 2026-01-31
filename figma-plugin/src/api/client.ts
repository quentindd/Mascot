// API client for backend communication

// Production URL (Railway deployment)
const API_BASE_URL = 'https://mascot-production.up.railway.app/api/v1';

// For local development, change to: 'http://localhost:3000/api/v1'

export interface CreateMascotRequest {
  name: string;
  prompt: string;
  style: string;
  type?: string;
  personality?: string;
  negativePrompt?: string;
  accessories?: string[];
  brandColors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
  autoFillUrl?: string;
  referenceImageUrl?: string;
  figmaFileId?: string;
  numVariations?: number;
}

export interface MascotResponse {
  id: string;
  name: string;
  prompt: string;
  style: string;
  type: string;
  personality: string;
  negativePrompt: string | null;
  accessories: string[] | null;
  brandColors: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  } | null;
  autoFillUrl: string | null;
  lifeStage: string | null;
  parentMascotId: string | null;
  variationIndex: number;
  batchId: string | null;
  characterId: string | null;
  status: string;
  fullBodyImageUrl: string | null;
  avatarImageUrl: string | null;
  squareIconUrl: string | null;
  referenceImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutoFillRequest {
  url: string;
}

export interface AutoFillResponse {
  name: string;
  description: string;
  suggestedPrompt: string;
  suggestedType: string;
  brandColors?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export interface CreateAnimationRequest {
  action: string;
  customAction?: string;
  figmaFileId?: string;
}

export interface AnimationJobResponse {
  id: string;
  mascotId: string;
  action: string;
  status: string;
  spriteSheetUrl: string | null;
  webmVideoUrl: string | null;
  movVideoUrl: string | null;
  lottieUrl: string | null;
  frameCount: number | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
  metadata?: { replicatePredictionUrl?: string; [key: string]: unknown };
}

export interface AnimationStatusResponse {
  id: string;
  status: string;
  progress?: number;
  errorMessage?: string;
}

export type LogoImageSource = 'fullBody' | 'avatar' | 'squareIcon';
export type LogoBackground = 'transparent' | 'white' | 'brand';

export interface CreateLogoPackRequest {
  brandColors?: string[];
  imageSource?: LogoImageSource;
  background?: LogoBackground;
  /** Direct image URL (PNG/JPEG/WebP). AI adapts mascot logo to this style. */
  referenceLogoUrl?: string;
  figmaFileId?: string;
}

export interface LogoPackResponse {
  id: string;
  mascotId: string;
  status: string;
  brandColors: string[] | null;
  sizes: Array<{
    name: string;
    width: number;
    height: number;
    url: string;
  }>;
  zipFileUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    plan: string;
    creditBalance: number;
  };
}

export class MascotAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  /** Login with email/password (no token required). Returns accessToken for use with plugin. */
  static async login(email: string, password: string): Promise<AuthResponse> {
    const url = `${API_BASE_URL}/auth/login`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      const msg = err?.message;
      throw new Error(typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : 'Login failed');
    }
    return response.json();
  }

  /** Register with email/password (no token required). Returns accessToken for use with plugin. */
  static async register(
    email: string,
    password: string,
    name?: string
  ): Promise<AuthResponse> {
    const url = `${API_BASE_URL}/auth/register`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        password,
        ...(name?.trim() ? { name: name.trim() } : {}),
      }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      const msg = err?.message;
      throw new Error(typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : 'Registration failed');
    }
    return response.json();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    };
    
    // Merge custom headers if provided
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } else {
        Object.assign(headers, options.headers);
      }
    }
    
    const requestOptions: RequestInit = {
      method: options.method,
      body: options.body,
      headers,
    };
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      const msg = error?.message;
      const message =
        typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : 'API request failed';
      throw new Error(message || `HTTP ${response.status}`);
    }

    // 204 No Content or empty body: do not parse JSON
    const contentLength = response.headers?.get?.('content-length');
    if (response.status === 204 || contentLength === '0') {
      return undefined as T;
    }
    return response.json().catch(() => undefined as T);
  }

  async createMascot(data: CreateMascotRequest): Promise<MascotResponse[]> {
    return this.request<MascotResponse[]>('/mascots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async autoFill(data: AutoFillRequest): Promise<AutoFillResponse> {
    return this.request<AutoFillResponse>('/mascots/auto-fill', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getBatchVariations(batchId: string): Promise<MascotResponse[]> {
    return this.request<MascotResponse[]>(`/mascots/batch/${batchId}`);
  }

  async evolveMascot(mascotId: string, targetStage: string): Promise<MascotResponse> {
    return this.request<MascotResponse>(`/mascots/${mascotId}/evolve`, {
      method: 'POST',
      body: JSON.stringify({ targetStage }),
    });
  }

  async getEvolutionChain(mascotId: string): Promise<any> {
    return this.request<any>(`/mascots/${mascotId}/evolution-chain`);
  }

  async getExportFormats(mascotId: string): Promise<any> {
    return this.request<any>(`/mascots/${mascotId}/export-formats`);
  }

  async getMascots(params?: {
    page?: number;
    limit?: number;
    figmaFileId?: string;
  }): Promise<PaginatedResponse<MascotResponse>> {
    // Build query string manually (URLSearchParams not available in Figma)
    const queryParts: string[] = [];
    if (params && params.page) {
      queryParts.push('page=' + params.page.toString());
    }
    if (params && params.limit) {
      queryParts.push('limit=' + params.limit.toString());
    }
    if (params && params.figmaFileId) {
      queryParts.push('figmaFileId=' + encodeURIComponent(params.figmaFileId));
    }
    
    const queryString = queryParts.length > 0 ? '?' + queryParts.join('&') : '';
    return this.request<PaginatedResponse<MascotResponse>>(
      '/mascots' + queryString
    );
  }

  async getMascot(id: string): Promise<MascotResponse> {
    return this.request<MascotResponse>(`/mascots/${id}`);
  }

  async createAnimation(
    mascotId: string,
    data: CreateAnimationRequest
  ): Promise<AnimationJobResponse> {
    return this.request<AnimationJobResponse>(`/mascots/${mascotId}/animations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getAnimation(id: string): Promise<AnimationJobResponse> {
    return this.request<AnimationJobResponse>(`/animations/${id}`);
  }

  async getAnimationStatus(id: string): Promise<AnimationStatusResponse> {
    return this.request<AnimationStatusResponse>(`/animations/${id}/status`);
  }

  async getMascotAnimations(mascotId: string): Promise<AnimationJobResponse[]> {
    const response = await this.request<{ data: AnimationJobResponse[] }>(
      `/mascots/${mascotId}/animations`
    );
    return response && response.data ? response.data : [];
  }

  async createLogoPack(
    mascotId: string,
    data: CreateLogoPackRequest
  ): Promise<LogoPackResponse> {
    return this.request<LogoPackResponse>(`/mascots/${mascotId}/logo-packs`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLogoPack(id: string): Promise<LogoPackResponse> {
    return this.request<LogoPackResponse>(`/logo-packs/${id}`);
  }

  async getMascotLogoPacks(mascotId: string): Promise<LogoPackResponse[]> {
    const response = await this.request<{ data: LogoPackResponse[] }>(
      `/mascots/${mascotId}/logo-packs`
    );
    return response && response.data ? response.data : [];
  }

  async createPose(mascotId: string, data: { prompt: string; figmaFileId?: string }): Promise<any> {
    return this.request<any>(`/mascots/${mascotId}/poses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPose(id: string): Promise<any> {
    return this.request<any>(`/poses/${id}`);
  }

  /** Fetch pose image via API proxy (CORS-safe for display in plugin UI). Returns data URL. */
  async getPoseImageDataUrl(poseId: string): Promise<string> {
    const url = `${API_BASE_URL}/poses/${poseId}/image`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to load pose image: ${response.status}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(blob);
    });
  }

  async getPoseStatus(id: string): Promise<any> {
    return this.request<any>(`/poses/${id}/status`);
  }

  async getMascotPoses(mascotId: string): Promise<any[]> {
    const response = await this.request<{ data: any[] }>(
      `/mascots/${mascotId}/poses`
    );
    return response && response.data ? response.data : [];
  }

  async getCredits(): Promise<{
    balance: number;
    plan: string;
    creditsLastResetAt: string | null;
    monthlyAllowance: number;
  }> {
    return this.request('/credits/balance');
  }

  async deleteMascot(id: string): Promise<void> {
    return this.request<void>(`/mascots/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAnimation(id: string): Promise<void> {
    return this.request<void>(`/animations/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteLogoPack(id: string): Promise<void> {
    return this.request<void>(`/logo-packs/${id}`, {
      method: 'DELETE',
    });
  }

  async deletePose(id: string): Promise<void> {
    return this.request<void>(`/poses/${id}`, {
      method: 'DELETE',
    });
  }
}
