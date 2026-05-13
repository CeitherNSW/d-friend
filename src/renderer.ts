const pet = document.getElementById('pet')!;

pet.addEventListener('mouseenter', () => {
  (window as any).electronAPI?.setIgnoreMouseEvents(false);
});

pet.addEventListener('mouseleave', () => {
  (window as any).electronAPI?.setIgnoreMouseEvents(true);
});

console.log('d-friend renderer loaded');
