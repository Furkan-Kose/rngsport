import { useEffect, useRef } from "react";

const Snowfall = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    interface Snowflake {
      x: number;
      y: number;
      radius: number;
      speed: number;
      wind: number;
      opacity: number;
    }

    const snowflakes: Snowflake[] = [];
    const snowflakeCount = 25;

    const createSnowflake = (initialY?: number): Snowflake => {
      return {
        x: Math.random() * canvas.width,
        y: initialY !== undefined ? initialY : -10,
        radius: 1 + Math.random() * 3,
        speed: 0.3 + Math.random() * 1,
        wind: (Math.random() - 0.5) * 0.5,
        opacity: 0.3 + Math.random() * 0.5,
      };
    };

    // Initialize snowflakes
    for (let i = 0; i < snowflakeCount; i++) {
      snowflakes.push(createSnowflake(Math.random() * canvas.height));
    }

    const drawSnowflake = (flake: Snowflake) => {
      ctx.save();
      ctx.globalAlpha = flake.opacity;
      ctx.translate(flake.x, flake.y);

      // Draw hexagonal snowflake
      const size = flake.radius * 2;
      const branches = 6;

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.lineCap = "round";

      // Add subtle glow
      ctx.shadowColor = "#ffffff";
      ctx.shadowBlur = flake.radius * 3;

      for (let i = 0; i < branches; i++) {
        const angle = (i * Math.PI * 2) / branches;
        ctx.save();
        ctx.rotate(angle);

        // Main branch
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -size);
        ctx.stroke();

        // Small side branches
        const branchLength = size * 0.4;
        const branchPos = size * 0.6;

        ctx.beginPath();
        ctx.moveTo(0, -branchPos);
        ctx.lineTo(-branchLength * 0.5, -branchPos - branchLength * 0.5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, -branchPos);
        ctx.lineTo(branchLength * 0.5, -branchPos - branchLength * 0.5);
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      snowflakes.forEach((flake) => {
        // Update position
        flake.y += flake.speed;
        flake.x += flake.wind + Math.sin(flake.y * 0.01) * 0.3;

        // Reset if off screen
        if (flake.y > canvas.height + 10) {
          flake.y = -10;
          flake.x = Math.random() * canvas.width;
        }

        // Wrap horizontally
        if (flake.x > canvas.width + 10) {
          flake.x = -10;
        } else if (flake.x < -10) {
          flake.x = canvas.width + 10;
        }

        drawSnowflake(flake);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-20"
    />
  );
};

export default Snowfall;
