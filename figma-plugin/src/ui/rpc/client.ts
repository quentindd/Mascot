// RPC client for UI to communicate with plugin code

export class RPCClient {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  constructor() {
    window.onmessage = (event: MessageEvent) => {
      const { type, data } = event.data.pluginMessage || {};
      if (type) {
        const handlers = this.listeners.get(type);
        if (handlers) {
          handlers.forEach((handler) => handler(data));
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
