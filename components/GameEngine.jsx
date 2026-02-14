import { useEffect, useRef, useState } from 'react';

export default function GameEngine({ config, onPlayTick }) {
  const canvasRef = useRef(null);
  const rafRef = useRef();
  const runningRef = useRef(true);
  const elapsedRef = useRef(0);
  const [state, setState] = useState({ running: true, score: 0, status: 'Playing', unsupported: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !config) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setState((s) => ({ ...s, unsupported: true, running: false, status: 'Canvas Unsupported' }));
      return;
    }

    runningRef.current = true;
    elapsedRef.current = 0;
    let score = 0;
    let last = performance.now();
    const gravity = config.physics.gravity || 0.35;
    const baseSpeed = config.obstaclePattern.speedBase || 120;
    const player = { x: 50, y: 120, vy: 0, size: 24, hits: 0 };
    let obstacles = [];
    let spawnCd = 0;

    const jump = () => {
      if (player.y >= 120) player.vy = -(config.physics.jumpForce || 8);
    };

    const keyHandler = (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') jump();
      if (e.code === 'KeyR' && !runningRef.current) window.location.reload();
    };

    window.addEventListener('keydown', keyHandler);
    canvas.addEventListener('pointerdown', jump);

    const stop = (status) => {
      runningRef.current = false;
      setState((s) => ({ ...s, status, running: false, score }));
    };

    const loop = (now) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      if (runningRef.current) {
        elapsedRef.current += dt;
        if (elapsedRef.current >= config.durationSec) {
          stop(score > config.durationSec ? 'Win' : 'Lose');
        }
      }

      if (runningRef.current) {
        player.vy += gravity;
        player.y += player.vy;
        if (player.y > 120) {
          player.y = 120;
          player.vy *= -0.15;
        }

        spawnCd -= dt;
        if (spawnCd <= 0) {
          spawnCd = (config.mechanics.spawnRate || 1) * (0.7 + Math.random());
          obstacles.push({ x: canvas.width + 20, y: 130, w: 18, h: 18 });
        }

        obstacles = obstacles
          .map((o) => ({ ...o, x: o.x - (baseSpeed + elapsedRef.current * 3) * dt }))
          .filter((o) => o.x > -30);

        for (const o of obstacles) {
          if (o.x < player.x + player.size && o.x + o.w > player.x && o.y < player.y + player.size && o.y + o.h > player.y) {
            player.hits += 1;
            o.x = -100;
          }
        }

        score += (config.mechanics.scorePerTick || 1) * dt;
        setState((s) => ({ ...s, score }));
        if (player.hits >= 3) stop('Lose');
        if (onPlayTick) onPlayTick(dt);
      }

      ctx.fillStyle = config.colorPalette?.[0] || '#111827';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = config.colorPalette?.[1] || '#22d3ee';
      ctx.fillRect(player.x, player.y, player.size, player.size);
      ctx.fillStyle = config.colorPalette?.[3] || '#f59e0b';
      obstacles.forEach((o) => ctx.fillRect(o.x, o.y, o.w, o.h));
      ctx.fillStyle = '#fff';
      ctx.fillText(`Score ${Math.floor(score)} | Hits ${player.hits}`, 10, 20);
      ctx.fillText(`${Math.max(0, Math.ceil(config.durationSec - elapsedRef.current))}s`, canvas.width - 50, 20);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      runningRef.current = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', keyHandler);
      canvas.removeEventListener('pointerdown', jump);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [config?.seed, onPlayTick, config]);

  if (state.unsupported) {
    return <button className="w-full rounded-lg bg-zinc-800 p-4 text-left">Try lightweight mode (no canvas support detected)</button>;
  }

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700">
      <canvas ref={canvasRef} width={720} height={180} className="w-full h-auto bg-black" />
      <div className="p-2 text-sm bg-zinc-900 flex justify-between">
        <span>{state.status}</span>
        <span>{config?.controls?.keyboard}</span>
      </div>
    </div>
  );
}
