// Confetti Effect Utility
// Creates a playful confetti burst animation

const CONFETTI_COLORS = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3',
    '#F38181', '#AA96DA', '#FCBAD3', '#A8D8EA',
    '#F26430', '#1F4D48', '#6C63FF', '#FF9F1C'
];

interface ConfettiOptions {
    count?: number;
    duration?: number;
    spread?: number;
}

export const triggerConfetti = (options: ConfettiOptions = {}): void => {
    const {
        count = 50,
        duration = 3000,
        spread = 100
    } = options;

    const container = document.createElement('div');
    container.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
  `;
    document.body.appendChild(container);

    // Create confetti pieces
    for (let i = 0; i < count; i++) {
        const piece = document.createElement('div');
        const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
        const size = Math.random() * 10 + 5;
        const left = 50 + (Math.random() - 0.5) * spread;
        const rotation = Math.random() * 360;
        const delay = Math.random() * 0.5;

        // Random shape
        const shapes = ['50%', '0%', '30%'];
        const borderRadius = shapes[Math.floor(Math.random() * shapes.length)];

        piece.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size * 1.5}px;
      background: ${color};
      left: ${left}%;
      top: -20px;
      transform: rotate(${rotation}deg);
      border-radius: ${borderRadius};
      animation: confetti-fall ${duration}ms ease-out ${delay}s forwards;
      opacity: 0.9;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;

        container.appendChild(piece);
    }

    // Clean up after animation
    setTimeout(() => {
        container.remove();
    }, duration + 500);
};

// Success celebration with multiple effects
export const celebrateSuccess = (): void => {
    triggerConfetti({ count: 60, spread: 120 });

    // Add a second burst with delay
    setTimeout(() => {
        triggerConfetti({ count: 30, spread: 80 });
    }, 200);
};

export default { triggerConfetti, celebrateSuccess };
