// RPC bridge for communication between plugin code and UI

export class RPC {
  send(type: string, data?: any) {
    figma.ui.postMessage({ type, data });
  }

  on(type: string, handler: (data: any) => void) {
    // This would be used in UI code, not in plugin code
    // Plugin code uses figma.ui.onmessage directly
  }
}
