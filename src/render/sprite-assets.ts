import type { SpriteManifest } from './animation-player';
import idle01 from '../../assets/sprites/idle_01.png';
import idle02 from '../../assets/sprites/idle_02.png';
import petting01 from '../../assets/sprites/petting_01.png';
import petting02 from '../../assets/sprites/petting_02.png';
import jump01 from '../../assets/sprites/jump_01.png';
import jump02 from '../../assets/sprites/jump_02.png';

export const DEFAULT_SPRITE_MANIFEST: SpriteManifest = {
  frameDurationMs: 180,
  clips: {
    idle: [
      { src: idle01 },
      { src: idle02 },
    ],
    walk: [
      { src: idle01 },
      { src: idle02 },
    ],
    happy: [
      { src: petting01 },
      { src: petting02 },
    ],
    jump: [
      { src: jump01 },
      { src: jump02 },
    ],
    drag: [
      { src: idle01 },
    ],
    fall: [
      { src: jump02 },
    ],
  },
};
