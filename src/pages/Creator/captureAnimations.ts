/**
 * html-to-image rasterises a *clone* of the node, and CSS animations on that
 * clone start again from their first keyframe. Shifting animation delays is not
 * enough — html-to-image rewrites pseudo-element styles into its own rules, so
 * a themed layer could still be exported at the wrong point of its loop (the
 * galaxy nebula, whose opacity and filter are animated, came out visibly darker
 * than the page).
 *
 * So instead of leaving any animation for the clone to re-run, this bakes the
 * current frame in: each animation is paused (optionally seeked to an exact
 * moment first), the properties its keyframes actually touch are read back, and
 * those values are pinned with `animation: none`. The live node and the clone
 * then render byte-for-byte the same thing.
 */

// Properties are read per animation from its own keyframes, so nothing is
// frozen that the theme does not actually animate.
const keyframeProperties = (animation: Animation): string[] => {
  const effect = animation.effect as KeyframeEffect | null;
  if (!effect || typeof effect.getKeyframes !== 'function') return [];
  const props = new Set<string>();
  for (const frame of effect.getKeyframes()) {
    for (const key of Object.keys(frame)) {
      if (key === 'offset' || key === 'easing' || key === 'composite') continue;
      // getKeyframes() reports camelCase; CSS needs the dashed form.
      props.add(key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`));
    }
  }
  return Array.from(props);
};

export function freezeAnimationsAt(root: HTMLElement, seekSeconds?: number): () => void {
  if (typeof (root as any).getAnimations !== 'function') return () => { };

  const animations = root.getAnimations({ subtree: true });
  if (!animations.length) return () => { };

  // Remember how to put everything back once the frame has been captured.
  const restore = animations.map(a => ({
    animation: a,
    playState: a.playState,
    currentTime: a.currentTime,
  }));

  for (const animation of animations) {
    try {
      animation.pause();
      if (seekSeconds !== undefined) animation.currentTime = seekSeconds * 1000;
    } catch {
      // Some animations refuse to be seeked; the pause alone still helps.
    }
  }

  // Group the frozen properties per (element, pseudo-element) pair.
  const targets = new Map<string, { el: Element; pseudo: string; props: Set<string> }>();
  let index = 0;
  const keys = new WeakMap<Element, string>();

  for (const animation of animations) {
    const effect = animation.effect as KeyframeEffect | null;
    const el = effect?.target as Element | undefined;
    if (!el) continue;
    const pseudo = (effect as any)?.pseudoElement || '';
    let key = keys.get(el);
    if (!key) { key = `cap-${index++}`; keys.set(el, key); }
    const id = `${key}${pseudo}`;
    if (!targets.has(id)) targets.set(id, { el, pseudo, props: new Set() });
    const entry = targets.get(id)!;
    for (const prop of keyframeProperties(animation)) entry.props.add(prop);
  }

  const rules: string[] = [];
  const marked: Element[] = [];

  targets.forEach(({ el, pseudo, props }) => {
    const computed = getComputedStyle(el, pseudo || undefined);
    const declarations = ['animation: none !important'];
    props.forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value) declarations.push(`${prop}: ${value} !important`);
    });
    const key = keys.get(el)!;
    if (!el.hasAttribute('data-capture-frame')) {
      el.setAttribute('data-capture-frame', key);
      marked.push(el);
    }
    rules.push(`[data-capture-frame="${key}"]${pseudo}{${declarations.join(';')};}`);
  });

  const style = document.createElement('style');
  style.textContent = rules.join('\n');
  document.head.appendChild(style);

  return () => {
    style.remove();
    marked.forEach(el => el.removeAttribute('data-capture-frame'));
    restore.forEach(({ animation, playState, currentTime }) => {
      try {
        animation.currentTime = currentTime;
        if (playState === 'running') animation.play();
      } catch {
        // The animation may already be gone; nothing to restore.
      }
    });
  };
}
