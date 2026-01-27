// RPC client for UI to communicate with plugin code

export class RPCClient {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    window.onmessage = (event: MessageEvent) => {
      // Figma sends messages directly in event.data, not in event.data.pluginMessage
      const message = event.data.pluginMessage || event.data;
      const { type, data } = message || {};
      
      if (type) {
        console.log('[RPCClient] Received message:', type, data ? `with ${Array.isArray(data.mascots) ? data.mascots.length + ' mascots' : 'data'}` : 'no data');
        const handlers = this.listeners.get(type);
        if (handlers) {
          handlers.forEach((handler) => handler(data));
        } else {
          console.warn('[RPCClient] No handlers registered for type:', type);
        }
      }
    };
  }

  send(type: string, data?: any) {
    parent.postMessage({ pluginMessage: { type, data } }, '*');
  }

  on(type: string, handler: (data: any) => void) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
  }

  off(type: string, handler: (data: any) => void) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  cleanup() {
    this.listeners.clear();
  }
}
