/**
 * 粒子系统
 */

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }
  
  update(dt) {
    this.particles = this.particles.filter(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.life -= dt;
      p.size = Math.max(0, p.size - p.shrink * dt);
      p.alpha = Math.max(0, p.life / p.maxLife);
      return p.life > 0 && p.size > 0;
    });
  }
  
  render(ctx) {
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowBlur = p.glow ? 8 : 0;
      ctx.shadowColor = p.color;
      
      if (p.type === 'circle') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'text') {
        ctx.font = `${p.size * 2}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      } else if (p.type === 'line') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 10, p.y + p.vy * 10);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  
  addParticle(x, y, vx, vy, color, size, life, options = {}) {
    this.particles.push({
      x, y, vx, vy,
      color,
      size,
      maxLife: life,
      life,
      alpha: 1,
      gravity: options.gravity || 0,
      drag: options.drag || 0.95,
      shrink: options.shrink || (size / life * 0.5),
      glow: options.glow || false,
      type: options.type || 'circle',
      text: options.text || '',
    });
  }
  
  burst(x, y, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        color, 3 + Math.random() * 4, 0.5 + Math.random() * 0.5,
        { glow: true, drag: 0.9, shrink: 5 });
    }
  }
  
  explosion(x, y, color, count = 20) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        color, 5 + Math.random() * 8, 0.8 + Math.random() * 0.8,
        { glow: true, gravity: 20, drag: 0.88, shrink: 4 });
    }
    // 烟雾
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 0.5,
        'rgba(200,200,200,0.5)', 8 + Math.random() * 12, 1.5 + Math.random(),
        { drag: 0.97, shrink: -2 }); // shrink负值表示扩大
    }
  }
  
  ring(x, y, color, radius, count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.addParticle(
        x + Math.cos(angle) * radius * 0.5,
        y + Math.sin(angle) * radius * 0.5,
        Math.cos(angle) * 2, Math.sin(angle) * 2,
        color, 4, 0.6, { glow: true, shrink: 6 }
      );
    }
  }
  
  hit(x, y, color, count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.addParticle(x, y, Math.cos(angle) * 2, Math.sin(angle) * 2,
        color, 3, 0.3, { drag: 0.85, shrink: 8 });
    }
  }
  
  evolutionBurst(x, y, color) {
    // 大型进化特效
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        color, 6 + Math.random() * 10, 1.5 + Math.random(),
        { glow: true, gravity: 5, drag: 0.91, shrink: 3 });
    }
    
    // DNA螺旋效果
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 4;
      const r = i * 4;
      this.addParticle(
        x + Math.cos(angle) * r * 0.3,
        y + Math.sin(angle) * r * 0.3,
        Math.cos(angle) * 0.5, Math.sin(angle) * 0.5 - 1,
        '#f1c40f', 4, 1.2,
        { glow: true, gravity: -10, drag: 0.98, shrink: 2 }
      );
    }
  }
  
  teleport(x, y, color) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      this.addParticle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        color, 4, 0.6, { glow: true, drag: 0.88, shrink: 6 });
    }
  }
  
  lightning(x1, y1, x2, y2) {
    const segments = 8;
    let px = x1, py = y1;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const nx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 30;
      const ny = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30;
      this.addParticle(px, py, 0, 0, '#f1c40f', 3, 0.3, { type: 'circle', glow: true, shrink: 8 });
      px = nx;
      py = ny;
    }
  }
  
  // 伤害数字
  damageNumber(x, y, text, color) {
    this.addParticle(x, y - 20, (Math.random() - 0.5) * 1, -2, color, 14, 1.2,
      { type: 'text', text, gravity: -5, drag: 0.99, shrink: 1 });
  }
}
