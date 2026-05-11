/**
 * 资源掉落物
 */

export class ResourceDrop {
  constructor(x, y, type, amount) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.amount = amount || (1 + Math.floor(Math.random() * 3));
    this.size = 14;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.lifetime = 0;
    this.pulseTimer = 0;
  }
  
  update(dt) {
    this.lifetime += dt;
    this.pulseTimer += dt;
  }
  
  render(ctx) {
    const bobY = Math.sin(Date.now() / 600 + this.bobOffset) * 4;
    const pulse = Math.sin(Date.now() / 400 + this.bobOffset) * 0.15 + 0.85;
    
    const rx = this.x;
    const ry = this.y + bobY;
    
    // 光晕
    const glow = ctx.createRadialGradient(rx, ry, 0, rx, ry, this.size * 2);
    glow.addColorStop(0, this.type.color + '60');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(rx, ry, this.size * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 背景圆
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.arc(rx, ry, this.size * pulse, 0, Math.PI * 2);
    ctx.fill();
    
    // 图标
    ctx.font = `${this.size * 1.4}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.icon, rx, ry);
    
    // 数量
    if (this.amount > 1) {
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`×${this.amount}`, rx, ry + this.size + 4);
    }
  }
}
