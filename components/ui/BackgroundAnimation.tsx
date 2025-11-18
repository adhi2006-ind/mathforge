import React, { useRef, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';

// --- Configuration ---
const PARTICLE_COUNT = 100;
const PARTICLE_SPEED = 0.5;
const INTERACTION_RADIUS = 150; // Radius for mouse interaction
const WAVE_COUNT = 3;

// --- Helper Functions ---
const random = (min: number, max: number) => Math.random() * (max - min) + min;
const operators = ['+', '-', '×', '÷', '^', '='];
const numbers = Array.from({ length: 10 }, (_, i) => i.toString());
const symbols = [...numbers, ...operators];

// --- Classes for Animation Objects ---
class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    symbol: string;

    constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = random(-PARTICLE_SPEED, PARTICLE_SPEED) || PARTICLE_SPEED / 2;
        this.vy = random(-PARTICLE_SPEED, PARTICLE_SPEED) || PARTICLE_SPEED / 2;
        this.size = random(12, 18);
        this.symbol = symbols[Math.floor(Math.random() * symbols.length)];
    }

    update(canvasWidth: number, canvasHeight: number, mouse: { x: number; y: number; active: boolean }) {
        // Mouse interaction
        if (mouse.active) {
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < INTERACTION_RADIUS) {
                const force = (INTERACTION_RADIUS - distance) / INTERACTION_RADIUS;
                this.x += (dx / distance) * force * 2;
                this.y += (dy / distance) * force * 2;
            }
        }

        this.x += this.vx;
        this.y += this.vy;

        // Wall collision
        if (this.x < 0 || this.x > canvasWidth) this.vx *= -1;
        if (this.y < 0 || this.y > canvasHeight) this.vy *= -1;
    }

    draw(ctx: CanvasRenderingContext2D, color: string) {
        ctx.fillStyle = color;
        ctx.font = `${this.size}px monospace`;
        ctx.fillText(this.symbol, this.x, this.y);
    }
}

class Wave {
    amplitude: number;
    frequency: number;
    phase: number;
    speed: number;
    color: string;
    lineWidth: number;

    constructor(canvasHeight: number, color: string) {
        this.amplitude = random(canvasHeight * 0.1, canvasHeight * 0.2);
        this.frequency = random(0.005, 0.01);
        this.phase = Math.random() * Math.PI * 2;
        this.speed = random(0.005, 0.01);
        this.color = color;
        this.lineWidth = random(1, 3);
    }

    update() {
        this.phase += this.speed;
    }

    draw(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.lineWidth;
        
        const yOffset = canvasHeight / 2;

        for (let x = 0; x < canvasWidth; x++) {
            const y = yOffset + this.amplitude * Math.sin(x * this.frequency + this.phase);
            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
    }
}


// --- MAIN COMPONENT ---
export const BackgroundAnimation: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        let waves: Wave[] = [];
        let mouse = { x: 0, y: 0, active: false };

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle(canvas.width, canvas.height));
            waves = Array.from({ length: WAVE_COUNT }, () => new Wave(canvas.height, `${theme.primary}60`)); // 60 for hex alpha
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            mouse.active = true;
        };
        
        const handleMouseLeave = () => {
            mouse.active = false;
        };

        window.addEventListener('resize', resizeCanvas);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);
        
        resizeCanvas();

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            waves.forEach(wave => {
                wave.update();
                wave.draw(ctx, canvas.width, canvas.height);
            });
            
            particles.forEach(p => {
                p.update(canvas.width, canvas.height, mouse);
                p.draw(ctx, `${theme.textSecondary}80`); // 80 for hex alpha
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [theme]); // Rerun effect if theme changes to update colors

    return (
        <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full z-0" 
        />
    );
};
