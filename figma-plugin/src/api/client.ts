// API client for backend communication
import { API_BASE_URL } from '../config';

export interface CreateMascotRequest {
  name: string;
  prompt: string;
  custom: string;
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
  /** Some API responses (e.g. batch variations) include imageUrl. */
  imageUrl?: string | null;
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

  /** Exchange one-time code (from Google OAuth success page) for access token. No auth header. */
  static async exchangeCode(code: string): Promise<AuthResponse> {
    const url = `${API_BASE_URL}/auth/exchange-code`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: response.statusText }));
      const msg = err?.message;
      throw new Error(typeof msg === 'string' ? msg : Array.isArray(msg) ? msg[0] : 'Invalid or expired code');
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
    const body: any = {
      email: email.trim(),
      password,
    };
    if (name && name.trim()) {
      body.name = name.trim();
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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
    const body = {
      name: data.name,
      prompt: data.prompt,
      style: data.custom,
      type: data.type,
      personality: data.personality,
      negativePrompt: data.negativePrompt,
      accessories: data.accessories,
      brandColors: data.brandColors,
      autoFillUrl: data.autoFillUrl,
      referenceImageUrl: data.referenceImageUrl,
      figmaFileId: data.figmaFileId,
      numVariations: data.numVariations,
    };
    return this.request<MascotResponse[]>('/mascots', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  /** Upload image (base64) and get public URL. */
  async uploadImage(base64: string): Promise<{ url: string }> {
    return this.request<{ url: string }>('/storage/upload-image', {
      method: 'POST',
      body: JSON.stringify({ image: base64 }),
    });
  }

  /** Create a mascot from an uploaded image URL (no AI generation). */
  async createMascotFromImage(
    imageUrl: string,
    name?: string
  ): Promise<MascotResponse> {
    const body: { imageUrl: string; name?: string } = { imageUrl: imageUrl.trim() };
    if (name && name.trim()) body.name = name.trim();
    return this.request<MascotResponse>('/mascots/from-image', {
      method: 'POST',
      body: JSON.stringify(body),
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

  /** Create Stripe checkout for a credit pack. Plan: "25" | "75" | "200". */
  async createCheckout(plan: string): Promise<{ checkoutUrl: string }> {
    return this.request<{ checkoutUrl: string }>('/billing/checkout', {
      method: 'POST',
      body: JSON.stringify({ plan }),
    });
  }

  async deleteMascot(id: string): Promise<void> {
    return this.request<void>(`/mascots/${id}`, {
      method: 'DELETE',
    });
  }

  async deletePose(id: string): Promise<void> {
    return this.request<void>(`/poses/${id}`, {
      method: 'DELETE',
    });
  }
}
