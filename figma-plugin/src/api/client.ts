// API client for backend communication

// For local development, change this to 'http://localhost:3000/api/v1'
// Note: Plugins run in browser context, so we can't use process.env
const API_BASE_URL = 'https://arthralgic-gruffy-bettina.ngrok-free.dev/api/v1';

export interface CreateMascotRequest {
  name: string;
  prompt: string;
  style: string;
  referenceImageUrl?: string;
  figmaFileId?: string;
}

export interface MascotResponse {
  id: string;
  name: string;
  prompt: string;
  style: string;
  characterId: string | null;
  status: string;
  fullBodyImageUrl: string | null;
  avatarImageUrl: string | null;
  squareIconUrl: string | null;
  referenceImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnimationRequest {
  action: string;
  resolution?: number;
  figmaFileId?: string;
}

export interface AnimationJobResponse {
  id: string;
  mascotId: string;
  action: string;
  status: string;
  resolution: number;
  spriteSheetUrl: string | null;
  webmVideoUrl: string | null;
  movVideoUrl: string | null;
  lottieUrl: string | null;
  frameCount: number | null;
  durationMs: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnimationStatusResponse {
  id: string;
  status: string;
  progress?: number;
  errorMessage?: string;
}

export interface CreateLogoPackRequest {
  brandColors?: string[];
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

export class MascotAPI {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
      'ngrok-skip-browser-warning': 'true', // Bypass ngrok warning page
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
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  async createMascot(data: CreateMascotRequest): Promise<MascotResponse> {
    return this.request<MascotResponse>('/mascots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
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
    return response.data;
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
    return response.data;
  }

  async getCredits(): Promise<{
    balance: number;
    plan: string;
    creditsLastResetAt: string | null;
    monthlyAllowance: number;
  }> {
    return this.request('/credits/balance');
  }
}
