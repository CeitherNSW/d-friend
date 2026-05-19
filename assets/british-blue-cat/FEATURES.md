# British Blue Shorthair Sprite Set

This DockCat-compatible set was redrawn with the image generation tool from the British Shorthair reference photos in `src/rawMT/` and the pose/style structure of `Resources/DefaultCat`.

## Extracted Cat Features

- Dense short blue-gray coat with low saturation and a plush texture.
- Round face, compact body, broad cheeks, and relatively short muzzle.
- Large round yellow-green eyes with dark rims.
- Dark slate nose, mouth line, paw pads, and outline accents.
- Muted gray-pink inner ears and mouth, kept subdued so the cat reads as blue-gray rather than pink.

## Style Match

- Follows DefaultCat's hand-drawn game-sprite style, dark outline, soft layered fur shading, and transparent PNG edge treatment.
- Recreates the DefaultCat action set with a short-haired British Shorthair silhouette instead of the original long-haired cat body.
- Uses image-generated drawings on a chroma-key sheet, then removes the background and slices each action into transparent PNG files.

## Included Actions

- `poses/dialogue/stand.png`
- `poses/held/held.png`
- `poses/resting/baguette.png`
- `poses/resting/curled_ball.png`
- `poses/resting/loaf.png`
- `poses/resting/side.png`
- `poses/resting/spluff.png`
- `poses/resting/stretch_sleep.png`
- `poses/transition/stretch.png`
- `poses/transition/yawn.png`
- `animations/walk/walk_01.png`
- `animations/walk/walk_02.png`
- `animations/walk/walk_03.png`
- `animations/walk/walk_04.png`

`manifest.json` keeps the DefaultCat canvas and anchor settings, with walk frames explicitly listed.

## Runtime Mapping

- Idle: random choice from `loaf`, `side`, `curled_ball`, `baguette`, `stretch_sleep`, and `spluff`.
- Walk: `walk_01` through `walk_04`.
- Drag: `held`.
- Happy: `stand`.
- Jump: `stretch`.
- Fall: `spluff`.
