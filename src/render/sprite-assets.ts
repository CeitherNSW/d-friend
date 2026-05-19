import type { SpriteManifest } from './animation-player';
import walk01 from '../../assets/british-blue-cat/animations/walk/walk_01.png';
import walk02 from '../../assets/british-blue-cat/animations/walk/walk_02.png';
import walk03 from '../../assets/british-blue-cat/animations/walk/walk_03.png';
import walk04 from '../../assets/british-blue-cat/animations/walk/walk_04.png';
import stand from '../../assets/british-blue-cat/poses/dialogue/stand.png';
import held from '../../assets/british-blue-cat/poses/held/held.png';
import baguette from '../../assets/british-blue-cat/poses/resting/baguette.png';
import curledBall from '../../assets/british-blue-cat/poses/resting/curled_ball.png';
import loaf from '../../assets/british-blue-cat/poses/resting/loaf.png';
import side from '../../assets/british-blue-cat/poses/resting/side.png';
import spluff from '../../assets/british-blue-cat/poses/resting/spluff.png';
import stretchSleep from '../../assets/british-blue-cat/poses/resting/stretch_sleep.png';
import stretch from '../../assets/british-blue-cat/poses/transition/stretch.png';
import yawn from '../../assets/british-blue-cat/poses/transition/yawn.png';

export const DEFAULT_SPRITE_MANIFEST: SpriteManifest = {
  frameDurationMs: 333,
  clips: {
    idle: [
      { src: loaf },
    ],
    walk: [
      { src: walk01 },
      { src: walk02 },
      { src: walk03 },
      { src: walk04 },
    ],
    happy: [
      { src: stand },
    ],
    jump: [
      { src: stretch },
    ],
    drag: [
      { src: held },
    ],
    fall: [
      { src: spluff },
    ],
    yawn: [
      { src: yawn },
    ],
  },
  clipVariants: {
    idle: [
      [{ src: loaf }],
      [{ src: side }],
      [{ src: curledBall }],
      [{ src: baguette }],
      [{ src: stretchSleep }],
      [{ src: spluff }],
    ],
    happy: [
      [{ src: stand }],
      [{ src: spluff }],
    ],
  },
  randomFlipClips: ['idle', 'happy', 'jump', 'drag', 'fall', 'yawn'],
};
