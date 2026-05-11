/**
 * UI 系统
 * 处理HUD、进化面板、游戏结算等
 */

import { EVOLUTION_TREE, RESOURCES, getEvolutionRequirementText, canEvolve } from './evolutionData.js';

export class UI {
  constructor(game) {
    this.game = game;
    
    this.messages = []; // { text, timer, maxTimer, color }
    this.resourcePickups = []; // { type, amount, timer }
    this.damageNumbers = []; // { x, y, text, color, vy, timer }
    
    this.evolutionPanelVisible = false;
    this.gameOverVisible = false;
    this.gameOverWin = false;
    
    this.evolutionAnim = null; // { timer, fromIcon, toIcon, toName }
    
    this.minimapSize = 150;
    this.minimapX = 10;
    this.minimapY = 10;
  }
  
  update(dt) {
    this.messages = this.messages.filter(m => {
      m.timer -= dt * 1000;
      return m.timer > 0;
    });
    
    this.resourcePickups = this.resourcePickups.filter(p => {
      p.timer -= dt * 1000;
      return p.timer > 0;
    });
    
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.y -= 40 * dt;
      d.timer -= dt * 1000;
      return d.timer > 0;
    });
    
    if (this.evolutionAnim) {
      this.evolutionAnim.timer -= dt * 1000;
      if (this.evolutionAnim.timer <= 0) this.evolutionAnim = null;
    }
  }
  
  render(ctx) {
    if (this.game.state === 'gameover') {
      this.renderGameOver(ctx);
      return;
    }
    
    if (this.game.state !== 'playing') return;
    
    // 小地图
    this.renderMinimap(ctx);
    
    // 玩家状态栏
    if (this.game.player && this.game.player.alive) {
      this.renderPlayerHUD(ctx);
    }
    
    // 右上角信息
    this.renderGameInfo(ctx);
    
    // 进化面板
    if (this.evolutionPanelVisible) {
      this.renderEvolutionPanel(ctx);
    }
    
    // 进化动画
    if (this.evolutionAnim) {
      this.renderEvolutionAnimation(ctx);
    }
    
    // 消息
    this.renderMessages(ctx);
    
    // 资源拾取提示
    this.renderResourcePickups(ctx);
    
    // 伤害数字
    this.renderDamageNumbers(ctx);
    
    // 操作提示
    this.renderControls(ctx);
    
    // 安全区倒计时
    this.renderSafeZoneTimer(ctx);
  }
  
  renderMinimap(ctx) {
    const g = this.game;
    const ms = this.minimapSize;
    const mx = g.width - ms - 10;
    const my = 10;
    const scaleX = ms / g.worldWidth;
    const scaleY = ms / g.worldHeight;
    
    // 背景
    ctx.fillStyle = 'rgba(0,20,0,0.8)';
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 2;
    ctx.fillRect(mx, my, ms, ms);
    ctx.strokeRect(mx, my, ms, ms);
    
    // 水域
    ctx.fillStyle = 'rgba(52, 152, 219, 0.4)';
    for (const w of g.waterZones) {
      ctx.beginPath();
      ctx.arc(mx + w.x * scaleX, my + w.y * scaleY, w.radius * scaleX, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 安全区
    ctx.strokeStyle = 'rgba(52,152,219,0.8)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(
      mx + g.safeZone.x * scaleX,
      my + g.safeZone.y * scaleY,
      g.safeZone.radius * scaleX, 0, Math.PI * 2
    );
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Bots
    for (const bot of g.bots) {
      if (!bot.alive) continue;
      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.arc(mx + bot.x * scaleX, my + bot.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 资源点
    for (const res of g.resources.slice(0, 50)) {
      ctx.fillStyle = res.type.color + '80';
      ctx.beginPath();
      ctx.arc(mx + res.x * scaleX, my + res.y * scaleY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 玩家位置
    if (g.player && g.player.alive) {
      ctx.fillStyle = '#f1c40f';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx + g.player.x * scaleX, my + g.player.y * scaleY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    // 视野框
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      mx + g.camera.x * scaleX, my + g.camera.y * scaleY,
      g.width * scaleX, g.height * scaleY
    );
    
    // 标签
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '9px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('小地图', mx + 3, my + ms - 3);
  }
  
  renderPlayerHUD(ctx) {
    const p = this.game.player;
    const g = this.game;
    const W = g.width;
    const H = g.height;
    
    // 底部面板背景
    const panelH = 120;
    const panelY = H - panelH;
    
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, panelY, W, panelH);
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, panelY, W, panelH);
    
    // ---- 左侧：物种信息 ----
    const specData = EVOLUTION_TREE[p.speciesId];
    
    ctx.fillStyle = p.color;
    ctx.font = `48px serif`;
    ctx.textAlign = 'center';
    ctx.fillText(p.icon, 50, panelY + 60);
    
    ctx.fillStyle = p.color;
    ctx.font = `bold 16px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(specData.name, 50, panelY + 80);
    
    // 等级显示
    const tierStars = ['☆', '★', '★★'][specData.tier];
    ctx.fillStyle = specData.tier === 2 ? '#f1c40f' : '#95a5a6';
    ctx.font = '12px serif';
    ctx.fillText(tierStars, 50, panelY + 98);
    
    // ---- HP条 ----
    const hpBarX = 100;
    const hpBarY = panelY + 12;
    const hpBarW = 220;
    const hpBarH = 14;
    
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(hpBarX - 1, hpBarY - 1, hpBarW + 2, hpBarH + 2);
    
    const hpPct = p.hp / p.maxHp;
    const hpColor = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpColor;
    ctx.fillRect(hpBarX, hpBarY, hpBarW * hpPct, hpBarH);
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`❤️ ${Math.ceil(p.hp)} / ${p.maxHp}`, hpBarX + hpBarW / 2, hpBarY + 11);
    
    // ---- 状态栏（属性）----
    const stats = [
      { icon: '⚔️', val: Math.round(p.currentAttack) },
      { icon: '🛡️', val: p.baseDefense },
      { icon: '💨', val: p.currentSpeed.toFixed(1) },
      { icon: '☠️', val: p.kills || 0 },
    ];
    
    stats.forEach((s, i) => {
      const sx = 100 + i * 56;
      const sy = panelY + 40;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${s.icon}${s.val}`, sx + 20, sy);
    });
    
    // ---- 资源栏 ----
    const resKeys = Object.values(RESOURCES);
    let rx = 100;
    const ry = panelY + 60;
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('收集物资：', rx - 5, ry - 2);
    
    for (const res of resKeys) {
      const amount = p.resources[res.id] || 0;
      if (amount > 0) {
        ctx.fillStyle = amount > 0 ? '#ecf0f1' : 'rgba(255,255,255,0.3)';
        ctx.font = '12px serif';
        ctx.textAlign = 'center';
        ctx.fillText(res.icon, rx + 10, ry + 18);
        
        ctx.fillStyle = amount > 5 ? '#f1c40f' : '#ecf0f1';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(amount, rx + 10, ry + 32);
        rx += 38;
      }
    }
    
    // ---- 中间：进化进度 ----
    if (specData.evolvesTo && specData.evolvesTo.length > 0) {
      const evoX = W / 2;
      const evoY = panelY + 15;
      
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('可进化为：', evoX, evoY);
      
      specData.evolvesTo.forEach((id, i) => {
        const targetData = EVOLUTION_TREE[id];
        const req = specData.evolutionRequirements[id];
        const canEvo = canEvolve(p.resources, req);
        const ex = evoX - 60 + i * 130;
        const ey = evoY + 20;
        
        ctx.fillStyle = canEvo ? 'rgba(46,204,113,0.3)' : 'rgba(0,0,0,0.4)';
        ctx.strokeStyle = canEvo ? '#2ecc71' : 'rgba(255,255,255,0.2)';
        ctx.lineWidth = canEvo ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(ex - 50, ey - 12, 100, 90, 8);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = '28px serif';
        ctx.textAlign = 'center';
        ctx.fillText(targetData.icon, ex, ey + 22);
        
        ctx.fillStyle = targetData.color;
        ctx.font = `bold 12px "Microsoft YaHei", sans-serif`;
        ctx.fillText(targetData.name, ex, ey + 42);
        
        // 需求
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = '9px "Microsoft YaHei", sans-serif';
        let reqY = ey + 56;
        for (const [resKey, need] of Object.entries(req)) {
          const resData = RESOURCES[resKey.toUpperCase()];
          const have = p.resources[resKey] || 0;
          const ok = have >= need;
          ctx.fillStyle = ok ? '#2ecc71' : '#e74c3c';
          ctx.textAlign = 'center';
          ctx.fillText(`${resData?.icon || resKey}${have}/${need}`, ex, reqY);
          reqY += 12;
        }
        
        if (canEvo) {
          ctx.fillStyle = '#f1c40f';
          ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
          ctx.fillText('✅ 按R进化', ex, reqY + 4);
        }
      });
    } else {
      // 最终形态
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑 已达到最终进化形态', W / 2, panelY + 55);
    }
    
    // ---- 右侧：技能 ----
    const skills = p.skills || [];
    const skillPanelX = W - 280;
    const skillPanelY = panelY + 8;
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '10px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('技能：', skillPanelX, skillPanelY);
    
    skills.forEach((skill, i) => {
      const sx = skillPanelX + i * 130;
      const sy = skillPanelY + 14;
      const cd = p.skillCooldowns[i] || 0;
      const ready = cd <= 0;
      
      // 技能框
      ctx.fillStyle = ready ? 'rgba(46,204,113,0.25)' : 'rgba(0,0,0,0.5)';
      ctx.strokeStyle = ready ? '#2ecc71' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(sx, sy, 120, 85, 8);
      ctx.fill();
      ctx.stroke();
      
      // 图标和名字
      ctx.fillStyle = ready ? '#fff' : 'rgba(255,255,255,0.4)';
      ctx.font = '26px serif';
      ctx.textAlign = 'center';
      ctx.fillText(skill.icon, sx + 18, sy + 28);
      
      ctx.fillStyle = ready ? '#f1c40f' : 'rgba(255,255,0,0.4)';
      ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(skill.name, sx + 34, sy + 18);
      
      const key = i === 0 ? '[Q]' : '[E]';
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillText(key, sx + 34, sy + 32);
      
      // 技能描述（简短）
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '9px "Microsoft YaHei", sans-serif';
      const desc = skill.description.slice(0, 20) + (skill.description.length > 20 ? '…' : '');
      ctx.fillText(desc, sx + 4, sy + 48);
      
      // 冷却
      if (!ready) {
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${cd.toFixed(1)}s`, sx + 60, sy + 68);
        
        // 冷却进度条
        const maxCd = skill.cooldown / 1000;
        const prog = 1 - (cd / maxCd);
        ctx.fillStyle = 'rgba(52,152,219,0.6)';
        ctx.fillRect(sx + 4, sy + 72, 112 * prog, 6);
      } else {
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('就绪', sx + 60, sy + 68);
      }
    });
  }
  
  renderGameInfo(ctx) {
    const g = this.game;
    const infoX = g.width - g.minimapSize - 10;
    // 存活人数
    const infoY = 175;
    
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(g.width - 170, infoY, 160, 50, 8);
    ctx.fill();
    
    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`👥 ${g.stats.aliveCount}`, g.width - 90, infoY + 30);
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('存活', g.width - 90, infoY + 46);
    
    // 击杀
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(g.width - 170, infoY + 58, 160, 50, 8);
    ctx.fill();
    
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⚔️ ${g.stats.kills}`, g.width - 90, infoY + 87);
    
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.fillText('击杀', g.width - 90, infoY + 103);
    
    // 存活时间
    const mins = Math.floor(g.stats.survivalTime / 60);
    const secs = Math.floor(g.stats.survivalTime % 60);
    
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(g.width - 170, infoY + 116, 160, 40, 8);
    ctx.fill();
    
    ctx.fillStyle = '#ecf0f1';
    ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱ ${mins}:${secs.toString().padStart(2, '0')}`, g.width - 90, infoY + 142);
  }
  
  renderEvolutionPanel(ctx) {
    const g = this.game;
    const p = g.player;
    if (!p || !p.alive) return;
    
    const specData = EVOLUTION_TREE[p.speciesId];
    if (!specData.evolvesTo || specData.evolvesTo.length === 0) {
      this.evolutionPanelVisible = false;
      return;
    }
    
    // 背景遮罩
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, g.width, g.height);
    
    // 面板
    const pw = 700;
    const ph = 400;
    const px = (g.width - pw) / 2;
    const py = (g.height - ph) / 2;
    
    ctx.fillStyle = '#0d1b0e';
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 16);
    ctx.fill();
    ctx.stroke();
    
    // 标题
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 26px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧬 进化选择', g.width / 2, py + 40);
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.fillText(`当前形态：${specData.icon} ${specData.name}  →  点击卡片进化`, g.width / 2, py + 65);
    
    // 进化选项
    specData.evolvesTo.forEach((id, i) => {
      const targetData = EVOLUTION_TREE[id];
      const req = specData.evolutionRequirements[id];
      const canEvo = canEvolve(p.resources, req);
      const cols = specData.evolvesTo.length;
      const cardW = Math.min(280, (pw - 40) / cols - 20);
      const cardH = 280;
      const cx = px + 20 + i * (cardW + 20) + cardW / 2;
      const cy = py + 90 + cardH / 2;
      
      // 卡片
      ctx.fillStyle = canEvo ? `${targetData.color}30` : 'rgba(20,20,20,0.6)';
      ctx.strokeStyle = canEvo ? targetData.color : 'rgba(255,255,255,0.15)';
      ctx.lineWidth = canEvo ? 3 : 1;
      ctx.beginPath();
      ctx.roundRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 12);
      ctx.fill();
      ctx.stroke();
      
      // 图标
      ctx.font = '60px serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = canEvo ? '#fff' : 'rgba(255,255,255,0.4)';
      ctx.fillText(targetData.icon, cx, cy - 80);
      
      // 名字
      ctx.fillStyle = targetData.color;
      ctx.font = `bold 18px "Microsoft YaHei", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(targetData.name, cx, cy - 40);
      
      // 属性
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      const attrs = [
        `❤️ ${targetData.hp}  ⚔️ ${targetData.attack}  🛡️ ${targetData.defense}  💨 ${targetData.speed}`,
      ];
      attrs.forEach((a, ai) => ctx.fillText(a, cx, cy - 18 + ai * 18));
      
      // 描述
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      const words = targetData.description;
      ctx.fillText(words, cx, cy + 8);
      
      // 技能展示
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillText('技能：', cx, cy + 28);
      (targetData.skills || []).forEach((sk, si) => {
        ctx.fillStyle = '#f1c40f';
        ctx.fillText(`${sk.icon} ${sk.name}`, cx, cy + 44 + si * 14);
      });
      
      // 需求资源
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px "Microsoft YaHei", sans-serif';
      ctx.fillText('需要物资：', cx, cy + 80);
      
      let reqX = cx - 60;
      for (const [resKey, need] of Object.entries(req)) {
        const resData = RESOURCES[resKey.toUpperCase()];
        const have = p.resources[resKey] || 0;
        const ok = have >= need;
        ctx.fillStyle = ok ? '#2ecc71' : '#e74c3c';
        ctx.font = '11px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${resData?.icon}${have}/${need}`, reqX + 30, cy + 95);
        reqX += 60;
      }
      
      if (canEvo) {
        // 闪烁按钮
        const btnAlpha = Math.sin(Date.now() / 300) * 0.3 + 0.7;
        ctx.globalAlpha = btnAlpha;
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.roundRect(cx - 55, cy + 108, 110, 26, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        ctx.fillStyle = '#000';
        ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`进化！`, cx, cy + 126);
        
        // 点击检测
        const mx = g.mouse.x;
        const my = g.mouse.y;
        const isHover = mx >= cx - 55 && mx <= cx + 55 && my >= cy + 108 && my <= cy + 134;
        if (isHover && g.mouse.buttons[0]) {
          g.mouse.buttons[0] = false; // 消费点击
          p.evolve(id);
        }
      }
    });
    
    // 关闭提示
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('按 R 键关闭', g.width / 2, py + ph - 14);
  }
  
  renderEvolutionAnimation(ctx) {
    const anim = this.evolutionAnim;
    const progress = 1 - anim.timer / anim.maxTimer;
    const g = this.game;
    
    const alpha = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
    ctx.globalAlpha = alpha;
    
    // 大字显示
    ctx.fillStyle = '#000';
    ctx.fillRect(0, g.height / 2 - 80, g.width, 160);
    
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 40px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧬 进化！', g.width / 2, g.height / 2 - 20);
    
    ctx.font = '60px serif';
    const fromX = g.width / 2 - 80 + progress * 60;
    const toX = g.width / 2 + 80 - (1 - progress) * 60;
    ctx.fillText(anim.fromIcon, fromX, g.height / 2 + 30);
    ctx.fillStyle = '#f1c40f';
    ctx.fillText('→', g.width / 2, g.height / 2 + 30);
    ctx.fillText(anim.toIcon, toX, g.height / 2 + 30);
    
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
    ctx.fillText(anim.toName, g.width / 2, g.height / 2 + 70);
    
    ctx.globalAlpha = 1;
  }
  
  renderMessages(ctx) {
    const g = this.game;
    this.messages.forEach((msg, i) => {
      const alpha = Math.min(1, msg.timer / 500);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = msg.color || '#fff';
      ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 8;
      ctx.shadowColor = msg.color || '#fff';
      ctx.fillText(msg.text, g.width / 2, g.height / 2 - 60 - i * 30);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    });
  }
  
  renderResourcePickups(ctx) {
    this.resourcePickups.forEach((pickup, i) => {
      const alpha = Math.min(1, pickup.timer / 400);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = pickup.type.color;
      ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'right';
      const g = this.game;
      ctx.fillText(`${pickup.type.icon} +${pickup.amount} ${pickup.type.name}`, g.width - 180, 200 + i * 24);
      ctx.globalAlpha = 1;
    });
  }
  
  renderDamageNumbers(ctx) {
    for (const dn of this.damageNumbers) {
      const alpha = Math.min(1, dn.timer / 300);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = dn.color;
      ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 6;
      ctx.shadowColor = dn.color;
      ctx.fillText(dn.text, dn.x, dn.y);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
  }
  
  renderControls(ctx) {
    const g = this.game;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = '11px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    const controls = 'WASD 移动  |  Q/E 技能  |  R 进化面板  |  鼠标 瞄准';
    ctx.fillText(controls, 10, g.height - 135);
  }
  
  renderSafeZoneTimer(ctx) {
    const g = this.game;
    const sz = g.safeZone;
    const timeLeft = Math.max(0, (sz.nextShrinkTime - sz.timer) / 1000);
    const shrinking = sz.timer >= sz.nextShrinkTime;
    
    const barW = 200;
    const barX = (g.width - barW) / 2;
    const barY = 12;
    
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(barX - 5, barY - 5, barW + 10, 30, 6);
    ctx.fill();
    
    if (!shrinking) {
      const pct = sz.timer / sz.nextShrinkTime;
      ctx.fillStyle = pct > 0.5 ? '#3498db' : pct > 0.25 ? '#f39c12' : '#e74c3c';
      ctx.fillRect(barX, barY, barW * (1 - pct), 20);
      
      ctx.fillStyle = '#fff';
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🔵 安全区缩小倒计时: ${timeLeft.toFixed(0)}s`, g.width / 2, barY + 14);
    } else {
      const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(231, 76, 60, ${pulse})`;
      ctx.fillRect(barX, barY, barW, 20);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ 安全区正在缩小！', g.width / 2, barY + 14);
    }
  }
  
  renderGameOver(ctx) {
    const g = this.game;
    
    // 背景
    ctx.fillStyle = this.gameOverWin ? 'rgba(0,30,0,0.95)' : 'rgba(30,0,0,0.95)';
    ctx.fillRect(0, 0, g.width, g.height);
    
    const cx = g.width / 2;
    const cy = g.height / 2;
    
    if (this.gameOverWin) {
      ctx.fillStyle = '#f1c40f';
      ctx.font = 'bold 70px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#f1c40f';
      ctx.fillText('🏆 胜利！', cx, cy - 100);
      
      ctx.fillStyle = '#2ecc71';
      ctx.font = '28px "Microsoft YaHei", sans-serif';
      ctx.shadowBlur = 0;
      ctx.fillText('你是最后的幸存者！', cx, cy - 40);
    } else {
      ctx.fillStyle = '#e74c3c';
      ctx.font = 'bold 60px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#e74c3c';
      ctx.fillText('💀 淘汰', cx, cy - 80);
      ctx.shadowBlur = 0;
    }
    
    // 统计
    const stats = g.stats;
    const p = g.player;
    const specName = p ? EVOLUTION_TREE[p.speciesId]?.name : '原始生物';
    
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '20px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    
    const lines = [
      `最终形态：${p?.icon || '🦠'} ${specName}`,
      `击杀：${stats.kills} 个`,
      `进化次数：${stats.evolutionCount} 次`,
      `收集物资：${stats.resourcesCollected} 个`,
      `存活时间：${Math.floor(stats.survivalTime / 60)}分${Math.floor(stats.survivalTime % 60)}秒`,
    ];
    
    lines.forEach((line, i) => {
      ctx.fillText(line, cx, cy + 20 + i * 32);
    });
    
    // 重玩按钮
    const btnW = 200;
    const btnH = 50;
    const btnX = cx - btnW / 2;
    const btnY = cy + 200;
    
    const mx = g.mouse.x;
    const my = g.mouse.y;
    const hover = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;
    
    ctx.fillStyle = hover ? '#27ae60' : '#2ecc71';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 10);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔄 再来一局', cx, btnY + 33);
  }
  
  // ========== API ==========
  showMessage(text, duration = 2000, color = '#f1c40f') {
    this.messages.unshift({ text, timer: duration, maxTimer: duration, color });
    if (this.messages.length > 4) this.messages.length = 4;
  }
  
  showResourcePickup(type, amount) {
    this.resourcePickups.unshift({ type, amount, timer: 2000 });
    if (this.resourcePickups.length > 5) this.resourcePickups.length = 5;
  }
  
  showDamageNumber(x, y, text, color) {
    this.damageNumbers.push({ x, y, text: String(text), color, timer: 800, vy: -1 });
  }
  
  showEvolutionAnimation(fromId, toId) {
    const from = EVOLUTION_TREE[fromId];
    const to = EVOLUTION_TREE[toId];
    this.evolutionAnim = {
      fromIcon: from?.icon || '🦠',
      toIcon: to?.icon || '🦠',
      toName: to?.name || '',
      timer: 2500,
      maxTimer: 2500,
    };
  }
  
  toggleEvolutionPanel(visible) {
    this.evolutionPanelVisible = visible;
  }
  
  showGameOver(win, stats) {
    this.gameOverVisible = true;
    this.gameOverWin = win;
  }
}
