/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, it, expect, vi } from 'vitest';
import { createPetRuntime } from './pet-runtime';

function createPetElement(): HTMLElement {
  const pet = document.createElement('div');
  Object.defineProperty(pet, 'offsetWidth', { value: 80 });
  Object.defineProperty(pet, 'offsetHeight', { value: 80 });
  document.body.appendChild(pet);
  return pet;
}

describe('PetRuntime', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should expose idle state for the breathing animation', () => {
    const pet = createPetElement();
    const runtime = createPetRuntime(pet, {
      viewport: { width: 1000, height: 800 },
      animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
    });

    expect(runtime.getCurrentBehaviorId()).toBe('idle');
    expect(pet.dataset.behavior).toBe('idle');
    expect(pet.classList.contains('is-idle')).toBe(true);

    runtime.destroy();
  });

  it('should play a petting reaction on single click and return to the previous behavior', () => {
    vi.useFakeTimers();
    const pet = createPetElement();
    const animation = { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() };
    const runtime = createPetRuntime(pet, {
      viewport: { width: 1000, height: 800 },
      animation,
    });

    pet.dispatchEvent(new MouseEvent('click', { clientX: 500, clientY: 760, bubbles: true }));
    vi.advanceTimersByTime(220);
    runtime.step(16);

    expect(runtime.getCurrentBehaviorId()).toBe('petting');
    expect(animation.play).toHaveBeenLastCalledWith('happy');

    vi.advanceTimersByTime(900);
    runtime.step(900);

    expect(runtime.getCurrentBehaviorId()).toBe('idle');
    expect(animation.play).toHaveBeenLastCalledWith('idle');

    runtime.destroy();
  });

  it('should treat a real mousedown mouseup click as petting rather than drag release', () => {
    vi.useFakeTimers();
    const pet = createPetElement();
    const animation = { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() };
    const runtime = createPetRuntime(pet, {
      viewport: { width: 1000, height: 800 },
      animation,
    });

    pet.dispatchEvent(new MouseEvent('mousedown', { clientX: 500, clientY: 760, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 500, clientY: 760, bubbles: true }));
    pet.dispatchEvent(new MouseEvent('click', { clientX: 500, clientY: 760, bubbles: true }));
    vi.advanceTimersByTime(220);
    runtime.step(16);

    expect(runtime.getCurrentBehaviorId()).toBe('petting');

    vi.advanceTimersByTime(900);
    runtime.step(900);

    expect(runtime.getCurrentBehaviorId()).toBe('idle');
    expect(animation.play).toHaveBeenLastCalledWith('idle');

    runtime.destroy();
  });


  it('should trigger jump on double click instead of the delayed petting reaction', () => {
    vi.useFakeTimers();
    const pet = createPetElement();
    const animation = { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() };
    const runtime = createPetRuntime(pet, {
      viewport: { width: 1000, height: 800 },
      animation,
    });

    pet.dispatchEvent(new MouseEvent('click', { clientX: 500, clientY: 760, bubbles: true }));
    pet.dispatchEvent(new MouseEvent('dblclick', { clientX: 500, clientY: 760, bubbles: true }));
    vi.advanceTimersByTime(250);
    runtime.step(16);

    expect(runtime.getCurrentBehaviorId()).toBe('jump');
    expect(animation.play).toHaveBeenLastCalledWith('jump');

    runtime.destroy();
  });

  it('should request the Electron pet context menu on right click', () => {
    const pet = createPetElement();
    const systemMenu = { showPetContextMenu: vi.fn() };
    const runtime = createPetRuntime(pet, {
      viewport: { width: 1000, height: 800 },
      animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
      systemMenu,
    });
    const preventDefault = vi.fn();

    pet.dispatchEvent(new MouseEvent('contextmenu', {
      clientX: 500,
      clientY: 760,
      bubbles: true,
    }));

    expect(systemMenu.showPetContextMenu).toHaveBeenCalledWith({ x: 500, y: 760 });
    expect(preventDefault).not.toHaveBeenCalled();

    runtime.destroy();
  });

  it('should enter drag and render the pet without losing the grab offset', () => {
    const pet = createPetElement();
    const runtime = createPetRuntime(pet, {
      viewport: { width: 1000, height: 800 },
      animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
    });

    pet.dispatchEvent(new MouseEvent('mousedown', { clientX: 500, clientY: 760, bubbles: true }));
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 620, clientY: 640, bubbles: true }));
    runtime.step(16);

    expect(runtime.getCurrentBehaviorId()).toBe('drag');
    expect(pet.dataset.behavior).toBe('drag');
    expect(pet.classList.contains('is-idle')).toBe(false);
    expect(pet.style.left).toBe('580px');
    expect(pet.style.top).toBe('600px');

    runtime.destroy();
  });

  it('should mark the sprite direction as right while walking with positive horizontal velocity', () => {
    const pet = createPetElement();
    const runtime = createPetRuntime(pet, {
      viewport: { width: 1000, height: 800 },
      animation: { play: vi.fn(), stop: vi.fn(), setLoop: vi.fn() },
    });

    runtime.ctx.requestTransition('walk', 'test');
    runtime.ctx.velocity.x = 80;
    runtime.step(16);

    expect(runtime.getCurrentBehaviorId()).toBe('walk');
    expect(pet.dataset.direction).toBe('right');

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
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 520, clientY: 700, bubbles: true }));
    pet.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));

    expect(passthrough.setIgnoreMouseEvents).not.toHaveBeenCalledWith(true);

    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 620, clientY: 640, bubbles: true }));
    expect(passthrough.setIgnoreMouseEvents).toHaveBeenLastCalledWith(true);

    runtime.destroy();
  });
});
