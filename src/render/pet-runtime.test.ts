/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { createPetRuntime } from './pet-runtime';

function createPetElement(): HTMLElement {
  const pet = document.createElement('div');
  Object.defineProperty(pet, 'offsetWidth', { value: 80 });
  Object.defineProperty(pet, 'offsetHeight', { value: 80 });
  document.body.appendChild(pet);
  return pet;
}

describe('PetRuntime', () => {
  it('should enter drag and render the pet without losing the grab offset', () => {
    const pet = createPetElement();
    const runtime = createPetRuntime(pet, {
      viewport: { width: 1000, height: 800 },
      animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
    });

    pet.dispatchEvent(new MouseEvent('mousedown', { clientX: 500, clientY: 760, bubbles: true }));
    runtime.step(16);

    expect(pet.style.left).toBe('460px');
    expect(pet.style.top).toBe('720px');

    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 620, clientY: 640, bubbles: true }));
    runtime.step(16);

    expect(runtime.getCurrentBehaviorId()).toBe('drag');
    expect(pet.style.left).toBe('580px');
    expect(pet.style.top).toBe('600px');

    runtime.destroy();
  });

  it('should keep mouse events enabled while dragging outside the pet element', () => {
    const pet = createPetElement();
    const passthrough = { setIgnoreMouseEvents: vi.fn() };
    const runtime = createPetRuntime(pet, {
      viewport: { width: 1000, height: 800 },
      animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
      mousePassthrough: passthrough,
    });

    pet.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    pet.dispatchEvent(new MouseEvent('mousedown', { clientX: 500, clientY: 720, bubbles: true }));
    pet.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

    expect(passthrough.setIgnoreMouseEvents).not.toHaveBeenCalledWith(true);

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 620, clientY: 640, bubbles: true }));
    expect(passthrough.setIgnoreMouseEvents).toHaveBeenLastCalledWith(true);

    runtime.destroy();
  });
});
