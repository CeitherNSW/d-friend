import { createPetRuntime } from './render/pet-runtime';
import { createObjectConfigReader } from './core/config';

declare global {
  interface Window {
    electronAPI?: {
      setIgnoreMouseEvents(ignore: boolean): void;
      showPetContextMenu(position: { x: number; y: number }): void;
      getConfig(): Promise<Record<string, unknown>>;
    };
  }
}

async function bootstrap(): Promise<void> {
  const pet = document.getElementById('pet')!;
  const config = await window.electronAPI?.getConfig?.();
  const runtime = createPetRuntime(pet, {
    mousePassthrough: window.electronAPI,
    systemMenu: window.electronAPI,
    config: config ? createObjectConfigReader(config) : undefined,
  });

  runtime.start();

  window.addEventListener('resize', () => {
    runtime.setViewport({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  });

  console.log('d-friend renderer loaded');
}

void bootstrap();
