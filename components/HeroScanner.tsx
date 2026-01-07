import React, { useEffect, useRef } from 'react';

// Using a simplified version of the provided logic adapted for React
// Note: We are keeping the core logic but ensuring it cleans up properly and mounts on refs

const HeroScanner: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const scannerCanvasRef = useRef<HTMLCanvasElement>(null);
  const cardLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !particleCanvasRef.current || !scannerCanvasRef.current || !cardLineRef.current) return;

    // --- Animation Logic Port ---
    // Due to space constraints and React lifecycle, we are adapting the provided logic 
    // to run within this effect scope.
    
    // THREE.js global check
    // @ts-ignore
    const THREE = window.THREE;
    if (!THREE) {
        console.error("Three.js not loaded");
        return;
    }

    const scannerWidth = 8;
    const scannerX = window.innerWidth / 2;
    const scannerLeft = scannerX - scannerWidth / 2;
    const scannerRight = scannerX + scannerWidth / 2;

    // 1. Particle System
    class ParticleSystem {
      scene: any; camera: any; renderer: any; particles: any; 
      particleCount = 400; velocities: any; alphas: any; animationId: number = 0;

      constructor(canvas: HTMLCanvasElement) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-window.innerWidth/2, window.innerWidth/2, 125, -125, 1, 1000);
        this.camera.position.z = 100;
        this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        this.renderer.setSize(window.innerWidth, 250);
        this.renderer.setClearColor(0xffffff, 0); // Transparent background, but conceptually white context
        this.createParticles();
        this.animate();
      }

      createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const sizes = new Float32Array(this.particleCount);
        const velocities = new Float32Array(this.particleCount);
        const alphas = new Float32Array(this.particleCount);

        // Texture generation
        const canvas = document.createElement("canvas");
        canvas.width = 32; canvas.height = 32;
        const ctx = canvas.getContext("2d");
        if(ctx) {
            const grad = ctx.createRadialGradient(16,16,0,16,16,16);
            grad.addColorStop(0, "#000"); // Black center
            grad.addColorStop(0.3, "rgba(0, 0, 0, 0.5)"); // Fading black
            grad.addColorStop(1, "transparent");
            ctx.fillStyle = grad;
            ctx.fillRect(0,0,32,32);
        }
        const texture = new THREE.CanvasTexture(canvas);

        for (let i = 0; i < this.particleCount; i++) {
          positions[i * 3] = (Math.random() - 0.5) * window.innerWidth * 2;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 250;
          positions[i * 3 + 2] = 0;
          // Black particles
          colors[i * 3] = 0; colors[i * 3 + 1] = 0; colors[i * 3 + 2] = 0;
          sizes[i] = Math.random() * 10 + 2;
          velocities[i] = Math.random() * 60 + 30;
          alphas[i] = Math.random() * 0.5; // Lower alpha for subtle effect on white
        }

        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
        
        this.velocities = velocities;
        this.alphas = alphas;

        const material = new THREE.ShaderMaterial({
            uniforms: { pointTexture: { value: texture } },
            vertexShader: `
                attribute float alpha; varying float vAlpha; varying vec3 vColor;
                void main() { vAlpha = alpha; vColor = color;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = 8.0; gl_Position = projectionMatrix * mvPosition; }
            `,
            fragmentShader: `
                uniform sampler2D pointTexture; varying float vAlpha; varying vec3 vColor;
                void main() { gl_FragColor = vec4(vColor, vAlpha) * texture2D(pointTexture, gl_PointCoord); }
            `,
            transparent: true, 
            blending: THREE.NormalBlending, 
            depthWrite: false, // Normal blending for dark on light
            vertexColors: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
      }

      animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        if(!this.particles) return;
        
        const positions = this.particles.geometry.attributes.position.array;
        
        for(let i=0; i<this.particleCount; i++) {
            positions[i*3] += this.velocities[i] * 0.016;
            if(positions[i*3] > window.innerWidth/2 + 100) positions[i*3] = -window.innerWidth/2 - 100;
        }
        this.particles.geometry.attributes.position.needsUpdate = true;
        this.renderer.render(this.scene, this.camera);
      }
      
      dispose() {
          cancelAnimationFrame(this.animationId);
          this.renderer.dispose();
      }
    }

    // 2. Card Stream Logic (simplified for React)
    const generateCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/\\*&^%$#@!";
        let str = "";
        for(let i=0; i<400; i++) str += chars[Math.floor(Math.random() * chars.length)];
        return str;
    };

    const cardContainer = cardLineRef.current;
    cardContainer.innerHTML = ''; // Clear previous

    // Create cards
    for(let i=0; i<10; i++) {
        const wrapper = document.createElement('div');
        wrapper.className = "card-wrapper";
        
        // Normal Card
        const card = document.createElement('div');
        card.className = "card card-normal";
        const img = document.createElement('img');
        img.src = `https://picsum.photos/400/250?random=${i}`;
        img.className = "card-image";
        card.appendChild(img);
        
        // ASCII Card
        const ascii = document.createElement('div');
        ascii.className = "card card-ascii";
        const txt = document.createElement('div');
        txt.className = "ascii-content";
        txt.textContent = generateCode();
        ascii.appendChild(txt);

        wrapper.appendChild(card);
        wrapper.appendChild(ascii);
        cardContainer.appendChild(wrapper);
    }

    // 3. Scanner Canvas Logic (The laser beam)
    class ScannerBeam {
        ctx: CanvasRenderingContext2D | null;
        w: number; h: number; animationId: number = 0;
        
        constructor(canvas: HTMLCanvasElement) {
            this.ctx = canvas.getContext('2d');
            this.w = window.innerWidth;
            this.h = 300;
            canvas.width = this.w;
            canvas.height = this.h;
            this.animate();
        }

        draw() {
            if(!this.ctx) return;
            this.ctx.clearRect(0,0,this.w, this.h);
            
            // Draw Beam
            const centerX = this.w / 2;
            const grad = this.ctx.createLinearGradient(centerX - 4, 0, centerX + 4, 0);
            grad.addColorStop(0, "rgba(0, 0, 0, 0)");
            grad.addColorStop(0.5, "rgba(0, 0, 0, 0.5)"); // Dark beam
            grad.addColorStop(1, "rgba(0, 0, 0, 0)");
            
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(centerX - 4, 0, 8, this.h);
            
            // Draw Glow
            const glowGrad = this.ctx.createLinearGradient(centerX - 20, 0, centerX + 20, 0);
            glowGrad.addColorStop(0, "transparent");
            glowGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.1)");
            glowGrad.addColorStop(1, "transparent");
            this.ctx.fillStyle = glowGrad;
            this.ctx.fillRect(centerX - 20, 0, 40, this.h);
        }

        animate() {
            this.animationId = requestAnimationFrame(() => this.animate());
            this.draw();
        }
        
        dispose() {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    // Animation Loop for Cards
    let animationFrameId: number;
    let position = 0;
    const animateCards = () => {
        position -= 1; // move left
        const totalWidth = (400 + 60) * 10; // card width + gap * count
        if (Math.abs(position) >= totalWidth) position = 0;
        
        if (cardLineRef.current) {
            cardLineRef.current.style.transform = `translateX(${position}px)`;
            
            // Clipping Logic
            const wrappers = document.querySelectorAll('.card-wrapper');
            wrappers.forEach((w: any) => {
               const rect = w.getBoundingClientRect();
               const normal = w.querySelector('.card-normal');
               const ascii = w.querySelector('.card-ascii');
               
               const center = window.innerWidth / 2;
               const width = 400;
               
               if (rect.left < center + 4 && rect.right > center - 4) {
                   // Intersecting
                   const intersectLeft = Math.max((center - 4) - rect.left, 0);
                   const intersectRight = Math.min((center + 4) - rect.left, width);
                   
                   const clipRight = (intersectLeft / width) * 100;
                   const clipLeft = (intersectRight / width) * 100;
                   
                   if(normal) normal.style.setProperty('--clip-right', `${clipRight}%`);
                   if(ascii) ascii.style.setProperty('--clip-left', `${clipLeft}%`);
                   
                   // Scanned effect trigger could go here
               } else {
                   if (rect.right < center) {
                       // passed
                       if(normal) normal.style.setProperty('--clip-right', `100%`);
                       if(ascii) ascii.style.setProperty('--clip-left', `100%`);
                   } else {
                       // coming
                       if(normal) normal.style.setProperty('--clip-right', `0%`);
                       if(ascii) ascii.style.setProperty('--clip-left', `0%`);
                   }
               }
            });
        }
        
        animationFrameId = requestAnimationFrame(animateCards);
    };

    // Initialize systems
    const ps = new ParticleSystem(particleCanvasRef.current);
    const sb = new ScannerBeam(scannerCanvasRef.current);
    animateCards();

    // Cleanup
    return () => {
        ps.dispose();
        sb.dispose();
        cancelAnimationFrame(animationFrameId);
    };

  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[500px] overflow-hidden bg-white flex items-center justify-center border-b border-black/10">
        {/* Particle Background */}
        <canvas ref={particleCanvasRef} className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[250px] z-0 pointer-events-none" />
        
        {/* Scanner Beam Canvas */}
        <canvas ref={scannerCanvasRef} className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[300px] z-20 pointer-events-none" />
        
        {/* Center Scanner Highlight Visual - Subtle on White */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-[320px] bg-black opacity-50 z-30" />

        {/* Card Stream */}
        <div className="absolute w-full h-[250px] flex items-center overflow-visible z-10">
            <div ref={cardLineRef} className="flex items-center gap-[60px] whitespace-nowrap will-change-transform pl-[50vw]">
                {/* Cards injected via JS */}
            </div>
        </div>

        {/* Styles for the dynamic elements */}
        <style>{`
            .card-wrapper {
                position: relative;
                width: 400px;
                height: 250px;
                flex-shrink: 0;
            }
            .card {
                position: absolute;
                top: 0; left: 0;
                width: 100%; height: 100%;
                border-radius: 12px;
                overflow: hidden;
                transition: clip-path 0.1s linear;
            }
            .card-normal {
                background: #fff;
                z-index: 2;
                clip-path: inset(0 0 0 var(--clip-right, 0%));
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                border: 1px solid #e5e5e5;
            }
            .card-ascii {
                background: #f8f8f8;
                z-index: 3;
                clip-path: inset(0 calc(100% - var(--clip-left, 0%)) 0 0);
                border: 1px solid #f0f0f0;
            }
            .card-image {
                width: 100%; height: 100%; object-fit: cover;
                /* Grayscale removed for colored cards */
            }
            .ascii-content {
                color: #000;
                font-family: monospace;
                font-size: 10px;
                line-height: 10px;
                word-break: break-all;
                opacity: 0.8;
                padding: 10px;
            }
        `}</style>
    </div>
  );
};

export default HeroScanner;