// Version minimale pour tester
/// <reference types="@figma/plugin-typings" />

figma.showUI(__html__, {
  width: 320,
  height: 400,
  themeColors: true,
});

figma.ui.onmessage = (msg: any) => {
  if (msg.type === 'test') {
    figma.ui.postMessage({ type: 'test-response', data: 'Plugin fonctionne!' });
  }
};
