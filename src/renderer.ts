import { createPetRuntime } from './render/pet-runtime';

declare global {
  interface Window {
    electronAPI?: {
      setIgnoreMouseEvents(ignore: boolean): void;
    };
  }
}

const pet = document.getElementById('pet')!;
const runtime = createPetRuntime(pet, {
  mousePassthrough: window.electronAPI,
});

runtime.start();

window.addEventListener('resize', () => {
  runtime.setViewport({
    width: window.innerWidth,
    height: window.innerHeight,
  });
});

console.log('d-friend renderer loaded');
