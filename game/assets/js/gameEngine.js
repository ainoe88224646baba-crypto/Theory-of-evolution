/**
 * 游戏引擎核心
 * 处理游戏循环、物理、碰撞检测
 */

import { RESOURCES, EVOLUTION_TREE, canEvolve } from './evolutionData.js';
import { Player } from './player.js';
import { ResourceDrop } from './resources.js';
import { UI } from './ui.js';
import { ParticleSystem } from './particles.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    
    // 世界尺寸（比画布大）
    this.worldWidth = 3000;
    this.worldHeight = 3000;
    
    // 摄像机
    this.camera = { x: 0, y: 0 };
    
    // 游戏状态
    this.state = 'menu'; // menu, playing, evolving, gameover
    this.running = false;
    this.lastTime = 0;
    
    // 安全区（大逃杀缩圈）
    this.safeZone = {
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
      radius: this.worldWidth * 0.45,
      targetRadius: this.worldWidth * 0.45,
      shrinkRate: 0.3, // 每秒缩小像素
      phase: 0,
      nextShrinkTime: 30000, // 30秒后开始缩圈
      timer: 0,
      damagePerSecond: 5,
    };
    
    // 实体
    this.player = null;
    this.bots = [];
    this.resources = [];
    this.projectiles = [];
    this.effects = [];
    this.traps = [];
    this.minions = [];
    
    // 粒子系统
    this.particles = new ParticleSystem();
    
    // UI
    this.ui = new UI(this);
    
    // 输入
    this.keys = {};
    this.mouse = { x: 0, y: 0, buttons: {} };
    
    // 游戏统计
    this.stats = {
      kills: 0,
      resourcesCollected: 0,
      evolutionCount: 0,
      survivalTime: 0,
      aliveCount: 0,
    };
    
    // 地形
    this.terrain = [];
    this.waterZones = [];
    
    this.initInput();
  }
  
  // ========== 初始化 ==========
  init() {
    this.generateTerrain();
    this.spawnResources();
    
    // 创建玩家
    this.player = new Player(
      this.worldWidth / 2 + (Math.random() - 0.5) * 400,
      this.worldHeight / 2 + (Math.random() - 0.5) * 400,
      true, // isPlayer
      this
    );
    
    // 创建AI机器人
    this.bots = [];
    const botCount = 19; // 总共20个参赛者
    for (let i = 0; i < botCount; i++) {
      const angle = (i / botCount) * Math.PI * 2;
      const dist = 400 + Math.random() * 800;
      const bot = new Player(
        this.worldWidth / 2 + Math.cos(angle) * dist,
        this.worldHeight / 2 + Math.sin(angle) * dist,
        false,
        this
      );
      bot.isBot = true;
      bot.botAI = this.createBotAI(bot);
      this.bots.push(bot);
    }
    
    this.stats.aliveCount = 20;
    this.state = 'playing';
    this.running = true;
    
    this.ui.showMessage('存活者: 20', 2000);
    this.ui.showMessage('进化！收集物资来进化为强大物种', 4000);
  }
  
  // ========== 地形生成 ==========
  generateTerrain() {
    this.terrain = [];
    this.waterZones = [];
    
    // 生成水域
    for (let i = 0; i < 12; i++) {
      this.waterZones.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        radius: 80 + Math.random() * 150,
      });
    }
    
    // 生成岩石/障碍
    for (let i = 0; i < 60; i++) {
      this.terrain.push({
        type: 'rock',
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        width: 40 + Math.random() * 80,
        height: 40 + Math.random() * 80,
        color: '#7f8c8d',
      });
    }
    
    // 生成树丛
    for (let i = 0; i < 80; i++) {
      this.terrain.push({
        type: 'tree',
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        radius: 25 + Math.random() * 35,
        color: '#27ae60',
      });
    }
  }
  
  // ========== 资源生成 ==========
  spawnResources() {
    this.resources = [];
    const resourceTypes = Object.values(RESOURCES);
    
    for (let i = 0; i < 200; i++) {
      const resType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      this.resources.push(new ResourceDrop(
        50 + Math.random() * (this.worldWidth - 100),
        50 + Math.random() * (this.worldHeight - 100),
        resType
      ));
    }
  }
  
  // ========== 主循环 ==========
  start() {
    this.running = true;
    requestAnimationFrame(this.loop.bind(this));
  }
  
  loop(timestamp) {
    if (!this.running) return;
    
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // 秒，最大0.05避免卡顿跳跃
    this.lastTime = timestamp;
    
    if (this.state === 'playing') {
      this.update(dt);
    }
    
    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
  
  // ========== 更新逻辑 ==========
  update(dt) {
    this.stats.survivalTime += dt;
    
    // 更新安全区
    this.updateSafeZone(dt);
    
    // 更新玩家
    if (this.player && this.player.alive) {
      this.player.update(dt, this.keys, this.mouse);
      this.updateCamera();
      
      // 玩家拾取资源
      this.checkResourceCollection(this.player);
      
      // 安全区伤害
      this.applySafeZoneDamage(this.player, dt);
    }
    
    // 更新Bot
    for (const bot of this.bots) {
      if (bot.alive) {
        bot.botAI(dt);
        bot.update(dt, {}, {});
        this.checkResourceCollection(bot);
        this.applySafeZoneDamage(bot, dt);
      }
    }
    
    // 更新抛射物
    this.updateProjectiles(dt);
    
    // 更新陷阱
    this.updateTraps(dt);
    
    // 更新随从
    this.updateMinions(dt);
    
    // 更新特效
    this.effects = this.effects.filter(e => {
      e.timer -= dt * 1000;
      return e.timer > 0;
    });
    
    // 更新粒子
    this.particles.update(dt);
    
    // 战斗检测
    this.checkCombat();
    
    // 检查存活
    this.checkAliveCount();
    
    // 定时补充资源
    if (Math.random() < 0.01) {
      this.spawnSingleResource();
    }
    
    // 更新UI
    this.ui.update(dt);
  }
  
  updateSafeZone(dt) {
    this.safeZone.timer += dt * 1000;
    
    if (this.safeZone.timer >= this.safeZone.nextShrinkTime) {
      if (this.safeZone.radius > 150) {
        this.safeZone.radius -= this.safeZone.shrinkRate * dt * 1000;
        if (this.safeZone.radius < 150) this.safeZone.radius = 150;
      }
    }
    
    // 阶段推进（每阶段缩小更快）
    if (this.safeZone.radius < this.safeZone.targetRadius * 0.7) {
      this.safeZone.phase++;
      this.safeZone.targetRadius = this.safeZone.radius;
      this.safeZone.shrinkRate *= 1.3;
    }
  }
  
  applySafeZoneDamage(entity, dt) {
    const dx = entity.x - this.safeZone.x;
    const dy = entity.y - this.safeZone.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > this.safeZone.radius) {
      const damage = this.safeZone.damagePerSecond * dt * (1 + this.safeZone.phase * 0.5);
      entity.takeDamage(damage, null);
      entity.poisoned = false; // 圈外不叠加毒
    }
  }
  
  updateCamera() {
    if (!this.player) return;
    this.camera.x = this.player.x - this.width / 2;
    this.camera.y = this.player.y - this.height / 2;
    
    // 边界
    this.camera.x = Math.max(0, Math.min(this.worldWidth - this.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.worldHeight - this.height, this.camera.y));
  }
  
  checkResourceCollection(entity) {
    this.resources = this.resources.filter(res => {
      const dx = entity.x - res.x;
      const dy = entity.y - res.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const collectRange = entity.size + res.size + 5;
      
      if (dist < collectRange) {
        // 收集资源
        const key = res.type.id;
        entity.resources[key] = (entity.resources[key] || 0) + res.amount;
        
        if (entity.isPlayer) {
          this.stats.resourcesCollected++;
          this.ui.showResourcePickup(res.type, res.amount);
          this.particles.burst(res.x - this.camera.x, res.y - this.camera.y, res.type.color, 8);
          entity.checkEvolution();
        }
        
        return false; // 移除资源
      }
      return true;
    });
  }
  
  checkCombat() {
    const allEntities = [
      ...(this.player && this.player.alive ? [this.player] : []),
      ...this.bots.filter(b => b.alive)
    ];
    
    // 近战碰撞伤害
    for (let i = 0; i < allEntities.length; i++) {
      for (let j = i + 1; j < allEntities.length; j++) {
        const a = allEntities[i];
        const b = allEntities[j];
        
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 物理推开
        const minDist = a.size + b.size;
        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          a.x += nx * overlap * 0.5;
          a.y += ny * overlap * 0.5;
          b.x -= nx * overlap * 0.5;
          b.y -= ny * overlap * 0.5;
        }
        
        // 攻击判定（由 Player 自身的 attackCooldown 控制）
        if (dist < a.attackRange && a.canAttack()) {
          a.performAttack(b);
        }
        if (dist < b.attackRange && b.canAttack()) {
          b.performAttack(a);
        }
      }
    }
  }
  
  updateProjectiles(dt) {
    this.projectiles = this.projectiles.filter(proj => {
      proj.x += proj.vx * dt;
      proj.y += proj.vy * dt;
      proj.life -= dt;
      
      if (proj.life <= 0) return false;
      
      // 检查命中
      const allEntities = [
        ...(this.player && this.player.alive ? [this.player] : []),
        ...this.bots.filter(b => b.alive)
      ];
      
      for (const entity of allEntities) {
        if (entity === proj.owner) continue;
        const dx = entity.x - proj.x;
        const dy = entity.y - proj.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < entity.size + proj.size) {
          // 命中
          entity.takeDamage(proj.damage, proj.owner);
          if (proj.poisonDps) {
            entity.applyPoison(proj.poisonDps, proj.poisonDuration);
          }
          if (proj.defenseReduction) {
            entity.defenseReductionMult = 1 - proj.defenseReduction;
            entity.defenseReductionTimer = proj.duration;
          }
          if (proj.knockback) {
            const angle = Math.atan2(dy, dx);
            entity.vx = Math.cos(angle) * proj.knockback;
            entity.vy = Math.sin(angle) * proj.knockback;
          }
          
          this.particles.burst(proj.x - this.camera.x, proj.y - this.camera.y, proj.color, 10);
          return false;
        }
      }
      
      return true;
    });
  }
  
  updateTraps(dt) {
    this.traps = this.traps.filter(trap => {
      trap.life -= dt;
      if (trap.life <= 0) return false;
      
      const allEntities = [
        ...(this.player && this.player.alive ? [this.player] : []),
        ...this.bots.filter(b => b.alive)
      ];
      
      for (const entity of allEntities) {
        if (entity === trap.owner) continue;
        const dx = entity.x - trap.x;
        const dy = entity.y - trap.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < trap.radius) {
          // 造成持续伤害
          entity.takeDamage(trap.dps * dt, trap.owner);
          // 定根
          if (!entity.rooted) {
            entity.rooted = true;
            entity.rootTimer = trap.rootDuration / 1000;
            this.particles.burst(entity.x - this.camera.x, entity.y - this.camera.y, '#f39c12', 5);
          }
        }
      }
      
      return true;
    });
  }
  
  updateMinions(dt) {
    this.minions = this.minions.filter(minion => {
      minion.life -= dt;
      if (minion.life <= 0 || !minion.owner.alive) return false;
      
      // 跟随主人
      const dx = minion.owner.x - minion.x;
      const dy = minion.owner.y - minion.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 80) {
        minion.x += (dx / dist) * minion.speed * dt * 60;
        minion.y += (dy / dist) * minion.speed * dt * 60;
      }
      
      // 攻击附近敌人
      minion.attackCooldown = (minion.attackCooldown || 0) - dt;
      if (minion.attackCooldown <= 0) {
        const allEntities = [
          ...(minion.owner.isPlayer && this.player && this.player.alive ? [] : [this.player].filter(Boolean)),
          ...this.bots.filter(b => b.alive && b !== minion.owner)
        ];
        
        for (const entity of allEntities) {
          const edx = entity.x - minion.x;
          const edy = entity.y - minion.y;
          const edist = Math.sqrt(edx * edx + edy * edy);
          
          if (edist < 60) {
            entity.takeDamage(minion.attack, minion.owner);
            minion.attackCooldown = 1.0; // 1秒攻击一次
            break;
          }
        }
      }
      
      return true;
    });
  }
  
  checkAliveCount() {
    const aliveBots = this.bots.filter(b => b.alive).length;
    const playerAlive = this.player && this.player.alive;
    this.stats.aliveCount = aliveBots + (playerAlive ? 1 : 0);
    
    if (!playerAlive && this.state === 'playing') {
      this.gameOver(false);
    }
    
    if (playerAlive && aliveBots === 0 && this.state === 'playing') {
      this.gameOver(true);
    }
  }
  
  spawnSingleResource() {
    const resourceTypes = Object.values(RESOURCES);
    const resType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    
    // 在安全区内生成
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.safeZone.radius * 0.9;
    this.resources.push(new ResourceDrop(
      this.safeZone.x + Math.cos(angle) * dist,
      this.safeZone.y + Math.sin(angle) * dist,
      resType
    ));
  }
  
  gameOver(win) {
    this.state = 'gameover';
    this.ui.showGameOver(win, this.stats);
  }
  
  // ========== Bot AI ==========
  createBotAI(bot) {
    const ai = {
      targetResource: null,
      targetEnemy: null,
      wanderTarget: null,
      updateTimer: 0,
      aggressionTimer: 0,
    };
    
    return (dt) => {
      ai.updateTimer -= dt;
      ai.aggressionTimer += dt;
      
      if (ai.updateTimer <= 0) {
        ai.updateTimer = 0.5 + Math.random() * 0.5; // 每0.5-1秒更新一次决策
        
        // 寻找最近的资源
        let closestRes = null;
        let closestResDist = Infinity;
        for (const res of this.resources) {
          const dx = res.x - bot.x;
          const dy = res.y - bot.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < closestResDist) {
            closestResDist = dist;
            closestRes = res;
          }
        }
        ai.targetResource = closestRes;
        
        // 如果Bot血量低，逃跑
        if (bot.hp / bot.maxHp < 0.3) {
          ai.targetEnemy = null;
          ai.wanderTarget = {
            x: bot.x + (Math.random() - 0.5) * 500,
            y: bot.y + (Math.random() - 0.5) * 500,
          };
          return;
        }
        
        // 随机攻击附近玩家/Bot
        if (ai.aggressionTimer > 3) {
          const allEnemies = [
            ...(this.player && this.player.alive ? [this.player] : []),
            ...this.bots.filter(b => b.alive && b !== bot)
          ];
          
          let closest = null;
          let closestDist = 400; // 攻击范围
          for (const enemy of allEnemies) {
            const dx = enemy.x - bot.x;
            const dy = enemy.y - bot.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
              closestDist = dist;
              closest = enemy;
            }
          }
          ai.targetEnemy = closest;
        }
        
        // 如果快要出圈，向圈内移动
        const dxZone = this.safeZone.x - bot.x;
        const dyZone = this.safeZone.y - bot.y;
        const distZone = Math.sqrt(dxZone * dxZone + dyZone * dyZone);
        if (distZone > this.safeZone.radius * 0.85) {
          ai.wanderTarget = { x: this.safeZone.x, y: this.safeZone.y };
          ai.targetEnemy = null;
        }
      }
      
      // 执行移动
      let targetX = bot.x;
      let targetY = bot.y;
      
      if (ai.targetEnemy && ai.targetEnemy.alive) {
        targetX = ai.targetEnemy.x;
        targetY = ai.targetEnemy.y;
        // 使用技能
        if (Math.random() < 0.01) {
          bot.useSkill(0);
        }
        if (Math.random() < 0.005) {
          bot.useSkill(1);
        }
      } else if (ai.targetResource) {
        targetX = ai.targetResource.x;
        targetY = ai.targetResource.y;
      } else if (ai.wanderTarget) {
        targetX = ai.wanderTarget.x;
        targetY = ai.wanderTarget.y;
        const dx = targetX - bot.x;
        const dy = targetY - bot.y;
        if (Math.sqrt(dx * dx + dy * dy) < 20) ai.wanderTarget = null;
      } else {
        // 随机游荡
        ai.wanderTarget = {
          x: Math.max(100, Math.min(this.worldWidth - 100, bot.x + (Math.random() - 0.5) * 300)),
          y: Math.max(100, Math.min(this.worldHeight - 100, bot.y + (Math.random() - 0.5) * 300)),
        };
      }
      
      // 设置Bot的虚拟按键
      const dx = targetX - bot.x;
      const dy = targetY - bot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 5) {
        bot.inputVx = (dx / dist) * bot.currentSpeed;
        bot.inputVy = (dy / dist) * bot.currentSpeed;
      } else {
        bot.inputVx = 0;
        bot.inputVy = 0;
      }
    };
  }
  
  // ========== 渲染 ==========
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    
    if (this.state === 'menu') {
      this.renderMenu();
      return;
    }
    
    if (this.state === 'gameover') {
      this.ui.render(ctx);
      return;
    }
    
    // 保存摄像机变换
    ctx.save();
    ctx.translate(-this.camera.x, -this.camera.y);
    
    // 渲染背景地图
    this.renderBackground(ctx);
    
    // 渲染地形
    this.renderTerrain(ctx);
    
    // 渲染资源
    for (const res of this.resources) {
      res.render(ctx);
    }
    
    // 渲染陷阱
    for (const trap of this.traps) {
      this.renderTrap(ctx, trap);
    }
    
    // 渲染抛射物
    for (const proj of this.projectiles) {
      this.renderProjectile(ctx, proj);
    }
    
    // 渲染随从
    for (const minion of this.minions) {
      this.renderMinion(ctx, minion);
    }
    
    // 渲染Bots
    for (const bot of this.bots) {
      if (bot.alive) bot.render(ctx, this.camera);
    }
    
    // 渲染玩家
    if (this.player && this.player.alive) {
      this.player.render(ctx, this.camera);
    }
    
    // 渲染特效
    for (const effect of this.effects) {
      this.renderEffect(ctx, effect);
    }
    
    // 安全区
    this.renderSafeZone(ctx);
    
    ctx.restore();
    
    // 渲染粒子（屏幕空间）
    this.particles.render(ctx);
    
    // 渲染UI（屏幕空间）
    this.ui.render(ctx);
  }
  
  renderBackground(ctx) {
    // 草地底色
    const gradient = ctx.createRadialGradient(
      this.worldWidth / 2, this.worldHeight / 2, 0,
      this.worldWidth / 2, this.worldHeight / 2, this.worldWidth * 0.6
    );
    gradient.addColorStop(0, '#4a7c59');
    gradient.addColorStop(0.6, '#3d6b4a');
    gradient.addColorStop(1, '#2c4f35');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);
    
    // 水域
    for (const water of this.waterZones) {
      const wg = ctx.createRadialGradient(water.x, water.y, 0, water.x, water.y, water.radius);
      wg.addColorStop(0, 'rgba(52, 152, 219, 0.8)');
      wg.addColorStop(1, 'rgba(41, 128, 185, 0.6)');
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.arc(water.x, water.y, water.radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 地图边界外变暗
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(-200, -200, this.worldWidth + 400, 200); // 上
    ctx.fillRect(-200, this.worldHeight, this.worldWidth + 400, 200); // 下
    ctx.fillRect(-200, 0, 200, this.worldHeight); // 左
    ctx.fillRect(this.worldWidth, 0, 200, this.worldHeight); // 右
  }
  
  renderTerrain(ctx) {
    for (const t of this.terrain) {
      if (t.type === 'rock') {
        ctx.fillStyle = t.color;
        ctx.strokeStyle = '#5d6d7e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(t.x - t.width / 2, t.y - t.height / 2, t.width, t.height, 8);
        ctx.fill();
        ctx.stroke();
      } else if (t.type === 'tree') {
        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(t.x + 5, t.y + 8, t.radius * 0.8, t.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // 树冠
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.arc(t.x - 5, t.y - 5, t.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  renderSafeZone(ctx) {
    const z = this.safeZone;
    
    // 安全区边界
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 安全区外红色蒙版
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, this.worldWidth, this.worldHeight);
    ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(231, 76, 60, 0.25)';
    ctx.fill();
    ctx.restore();
  }
  
  renderTrap(ctx, trap) {
    ctx.globalAlpha = 0.6;
    const g = ctx.createRadialGradient(trap.x, trap.y, 0, trap.x, trap.y, trap.radius);
    g.addColorStop(0, 'rgba(243, 156, 18, 0.8)');
    g.addColorStop(1, 'rgba(243, 156, 18, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(trap.x, trap.y, trap.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#f39c12';
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🍯', trap.x, trap.y + 7);
    ctx.globalAlpha = 1;
  }
  
  renderProjectile(ctx, proj) {
    ctx.fillStyle = proj.color || '#fff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = proj.color || '#fff';
    ctx.beginPath();
    ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  
  renderMinion(ctx, minion) {
    ctx.fillStyle = '#f1c40f';
    ctx.strokeStyle = '#e67e22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(minion.x, minion.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = '10px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🐝', minion.x, minion.y + 4);
  }
  
  renderEffect(ctx, effect) {
    const alpha = effect.timer / effect.maxTimer;
    ctx.globalAlpha = alpha * 0.7;
    
    if (effect.type === 'shockwave') {
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (1 - alpha) + effect.maxRadius * (1 - alpha), 0, Math.PI * 2);
      ctx.stroke();
    } else if (effect.type === 'explosion') {
      const g = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, effect.radius * alpha);
      g.addColorStop(0, effect.color);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  }
  
  renderMenu() {
    const ctx = this.ctx;
    // 渐变背景
    const bg = ctx.createLinearGradient(0, 0, this.width, this.height);
    bg.addColorStop(0, '#0d1b0e');
    bg.addColorStop(1, '#1a3522');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);
    
    // 标题
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 56px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#27ae60';
    ctx.fillText('进化战场', this.width / 2, this.height / 2 - 80);
    
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#95a5a6';
    ctx.font = '22px "Microsoft YaHei", sans-serif';
    ctx.fillText('Evolution Battleground', this.width / 2, this.height / 2 - 35);
    
    ctx.fillStyle = '#ecf0f1';
    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.fillText('收集物资，进化物种，成为最后的幸存者！', this.width / 2, this.height / 2 + 20);
    
    // 开始按钮提示
    const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
    ctx.fillText('[ 按 SPACE 或点击开始游戏 ]', this.width / 2, this.height / 2 + 100);
    ctx.globalAlpha = 1;
    
    // 物种预览
    const species = ['🦠', '🦌', '🐺', '🐊', '🦂', '🦣', '🦖', '🐯', '🐍', '🦑', '⚡', '🦗', '🐝'];
    ctx.font = '28px serif';
    species.forEach((s, i) => {
      const x = (this.width / (species.length + 1)) * (i + 1);
      const y = this.height / 2 + 180 + Math.sin(Date.now() / 800 + i * 0.5) * 8;
      ctx.fillText(s, x, y);
    });
  }
  
  // ========== 输入处理 ==========
  initInput() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      this.keys[e.code] = true;
      
      if (this.state === 'menu' && (e.code === 'Space' || e.key === ' ')) {
        this.init();
      }
      
      // 技能快捷键
      if (this.state === 'playing' && this.player) {
        if (e.key === 'q' || e.key === 'Q') this.player.useSkill(0);
        if (e.key === 'e' || e.key === 'E') this.player.useSkill(1);
        if (e.key === 'r' || e.key === 'R') this.player.showEvolutionPanel();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
      this.keys[e.code] = false;
    });
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - rect.left) * (this.width / rect.width);
      this.mouse.y = (e.clientY - rect.top) * (this.height / rect.height);
    });
    
    this.canvas.addEventListener('mousedown', (e) => {
      this.mouse.buttons[e.button] = true;
      if (this.state === 'menu') {
        this.init();
      }
      if (this.state === 'gameover') {
        // 重新开始
        this.resetGame();
      }
    });
    
    this.canvas.addEventListener('mouseup', (e) => {
      this.mouse.buttons[e.button] = false;
    });
    
    // 阻止右键菜单
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  
  resetGame() {
    this.bots = [];
    this.resources = [];
    this.projectiles = [];
    this.effects = [];
    this.traps = [];
    this.minions = [];
    this.player = null;
    this.stats = { kills: 0, resourcesCollected: 0, evolutionCount: 0, survivalTime: 0, aliveCount: 0 };
    this.safeZone = {
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
      radius: this.worldWidth * 0.45,
      targetRadius: this.worldWidth * 0.45,
      shrinkRate: 0.3,
      phase: 0,
      nextShrinkTime: 30000,
      timer: 0,
      damagePerSecond: 5,
    };
    this.state = 'menu';
  }
  
  // 添加特效
  addEffect(type, x, y, color, radius, duration) {
    this.effects.push({ type, x, y, color, radius, maxRadius: radius, timer: duration, maxTimer: duration });
  }
  
  // 添加抛射物
  addProjectile(owner, x, y, targetX, targetY, damage, speed, size, color, options = {}) {
    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    this.projectiles.push({
      owner, x, y,
      vx: (dx / dist) * speed,
      vy: (dy / dist) * speed,
      damage,
      size: size || 8,
      color: color || '#fff',
      life: options.range ? options.range / speed : 2,
      ...options
    });
  }
  
  // 添加随从
  addMinion(owner, x, y, hp, attack, speed) {
    this.minions.push({ owner, x, y, hp, maxHp: hp, attack, speed, life: 30, attackCooldown: 0 });
  }
  
  // 添加陷阱
  addTrap(owner, x, y, radius, dps, rootDuration, life) {
    this.traps.push({ owner, x, y, radius, dps, rootDuration, life });
  }
}
