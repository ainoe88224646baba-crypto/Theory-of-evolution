/**
 * 玩家/角色类
 * 处理移动、攻击、进化、技能
 */

import { EVOLUTION_TREE, canEvolve } from './evolutionData.js';

export class Player {
  constructor(x, y, isPlayer, game) {
    this.x = x;
    this.y = y;
    this.isPlayer = isPlayer;
    this.game = game;
    
    // 基础属性（来自进化数据）
    this.speciesId = 'PRIMORDIAL';
    this.applySpeciesData(EVOLUTION_TREE.PRIMORDIAL);
    
    // 动态属性
    this.vx = 0;
    this.vy = 0;
    this.inputVx = 0;
    this.inputVy = 0;
    
    // 状态
    this.alive = true;
    this.poisoned = false;
    this.poisonDps = 0;
    this.poisonTimer = 0;
    this.stunned = false;
    this.stunTimer = 0;
    this.rooted = false;
    this.rootTimer = 0;
    this.invisible = false;
    this.invisibleTimer = 0;
    this.raging = false;
    this.ragingTimer = 0;
    this.ragingAttackMult = 1;
    this.frozen = false;
    this.frozenTimer = 0;
    this.silenced = false;
    this.silencedTimer = 0;
    this.speedMult = 1;
    this.speedMultTimer = 0;
    this.defenseReductionMult = 1;
    this.defenseReductionTimer = 0;
    this.nextAttackMult = 1; // 潜水突袭用
    
    // 攻击
    this._attackCooldown = 0;
    this.attackRange = 0; // 由 applySpeciesData 设置
    
    // 技能冷却
    this.skillCooldowns = [0, 0];
    
    // 资源收集
    this.resources = {};
    
    // 随从
    this.minionCount = 0;
    
    // 名字（Bot）
    if (!isPlayer) {
      this.name = this.randomBotName();
    } else {
      this.name = '玩家';
    }
    
    // 动画
    this.animFrame = 0;
    this.animTimer = 0;
    this.facingAngle = 0;
    
    // 击杀计数
    this.kills = 0;
    
    // 进化面板显示
    this.showingEvolutionPanel = false;
  }
  
  applySpeciesData(data) {
    this.speciesId = data.id;
    this.speciesData = data;
    this.maxHp = data.hp;
    this.hp = data.hp;
    this.baseSpeed = data.speed;
    this.currentSpeed = data.speed;
    this.baseAttack = data.attack;
    this.currentAttack = data.attack;
    this.baseDefense = data.defense;
    this.size = data.size;
    this.color = data.color;
    this.icon = data.icon;
    this.moveType = data.moveType;
    this.attackRange = data.defaultAttack.range + data.size;
    this.attackDamage = data.defaultAttack.damage;
    this.attackCooldownMax = data.defaultAttack.cooldown / 1000;
    this.skills = data.skills;
  }
  
  randomBotName() {
    const names = ['迅猛', '强悍', '古老', '黑暗', '原始', '凶猛', '神秘', '危险', '致命', '野蛮',
                   '史前', '上古', '进化', '暗影', '血腥', '疯狂', '残暴', '猛烈', '威猛'];
    const suffixes = ['猎手', '先驱', '战士', '霸主', '领主', '杀手', '统治者', '破坏者', '掠夺者'];
    return names[Math.floor(Math.random() * names.length)] + suffixes[Math.floor(Math.random() * suffixes.length)];
  }
  
  // ========== 更新 ==========
  update(dt, keys, mouse) {
    // 更新各种状态计时器
    this.updateStatusEffects(dt);
    
    // 处理移动
    if (!this.stunned && !this.frozen) {
      if (this.isPlayer) {
        this.handlePlayerInput(dt, keys, mouse);
      } else {
        // Bot的移动由 GameEngine 的 botAI 设置 inputVx/inputVy
        this.vx = this.inputVx;
        this.vy = this.inputVy;
      }
    } else {
      this.vx *= 0.8;
      this.vy *= 0.8;
    }
    
    // 应用速度
    const speed = this.currentSpeed * this.speedMult;
    const len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (len > 0) {
      const nx = this.vx / len;
      const ny = this.vy / len;
      this.x += nx * speed * dt * 60;
      this.y += ny * speed * dt * 60;
      this.facingAngle = Math.atan2(ny, nx);
    }
    
    // 边界约束
    this.x = Math.max(this.size, Math.min(this.game.worldWidth - this.size, this.x));
    this.y = Math.max(this.size, Math.min(this.game.worldHeight - this.size, this.y));
    
    // 攻击冷却
    this._attackCooldown = Math.max(0, this._attackCooldown - dt);
    
    // 技能冷却
    this.skillCooldowns[0] = Math.max(0, this.skillCooldowns[0] - dt);
    this.skillCooldowns[1] = Math.max(0, this.skillCooldowns[1] - dt);
    
    // 毒素伤害
    if (this.poisoned && this.poisonTimer > 0) {
      this.hp -= this.poisonDps * dt;
      if (this.hp <= 0) this.die(null);
    }
    
    // 动画
    this.animTimer += dt;
    if (this.animTimer > 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 4;
    }
    
    // 检查进化条件
    if (this.isPlayer) {
      this.checkEvolution();
    }
  }
  
  updateStatusEffects(dt) {
    if (this.stunned) { this.stunTimer -= dt; if (this.stunTimer <= 0) this.stunned = false; }
    if (this.frozen) { this.frozenTimer -= dt; if (this.frozenTimer <= 0) this.frozen = false; }
    if (this.rooted) { this.rootTimer -= dt; if (this.rootTimer <= 0) this.rooted = false; }
    if (this.silenced) { this.silencedTimer -= dt; if (this.silencedTimer <= 0) this.silenced = false; }
    if (this.poisoned) { this.poisonTimer -= dt; if (this.poisonTimer <= 0) { this.poisoned = false; this.poisonDps = 0; } }
    if (this.invisible) { this.invisibleTimer -= dt; if (this.invisibleTimer <= 0) { this.invisible = false; } }
    if (this.raging) { this.ragingTimer -= dt; if (this.ragingTimer <= 0) { this.raging = false; this.currentAttack = this.baseAttack; } }
    if (this.speedMultTimer > 0) {
      this.speedMultTimer -= dt;
      if (this.speedMultTimer <= 0) { this.speedMult = 1; }
    }
    if (this.defenseReductionTimer > 0) {
      this.defenseReductionTimer -= dt;
      if (this.defenseReductionTimer <= 0) { this.defenseReductionMult = 1; }
    }
  }
  
  handlePlayerInput(dt, keys, mouse) {
    let vx = 0;
    let vy = 0;
    
    if (keys['w'] || keys['W'] || keys['ArrowUp']) vy -= 1;
    if (keys['s'] || keys['S'] || keys['ArrowDown']) vy += 1;
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) vx -= 1;
    if (keys['d'] || keys['D'] || keys['ArrowRight']) vx += 1;
    
    this.vx = vx;
    this.vy = vy;
    
    // 鼠标朝向
    const worldMouseX = mouse.x + this.game.camera.x;
    const worldMouseY = mouse.y + this.game.camera.y;
    this.facingAngle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);
  }
  
  // ========== 攻击 ==========
  canAttack() {
    return this._attackCooldown <= 0 && !this.stunned && !this.frozen;
  }
  
  performAttack(target) {
    if (!this.canAttack()) return;
    
    let damage = this.currentAttack;
    
    // 狂暴加成
    if (this.raging) {
      damage *= this.ragingAttackMult;
    }
    
    // 潜水突袭加成
    if (this.nextAttackMult > 1) {
      damage *= this.nextAttackMult;
      this.nextAttackMult = 1;
      this.invisible = false;
      // 暗影闪光
      this.game.particles.burst(this.x - this.game.camera.x, this.y - this.game.camera.y, '#1abc9c', 15);
    }
    
    // 执行效果（斩首一击）
    if (this.speciesId === 'SABERTOOTH') {
      // handled in useSkill
    }
    
    target.takeDamage(damage, this);
    this._attackCooldown = this.attackCooldownMax;
    
    // 毒牙自动附毒
    if (this.speciesData.defaultAttack.poison) {
      const p = this.speciesData.defaultAttack.poison;
      target.applyPoison(p.dps, p.duration);
    }
    
    // 嗜血：击杀恢复
    if (this.raging && this.speciesData.skills[0]?.id === 'bloodrage') {
      if (!target.alive) {
        this.heal(15);
        this.game.particles.burst(this.x - this.game.camera.x, this.y - this.game.camera.y, '#e74c3c', 8);
      }
    }
    
    // 攻击特效
    this.game.particles.hit(
      (target.x - this.game.camera.x),
      (target.y - this.game.camera.y),
      this.color, 5
    );
  }
  
  takeDamage(amount, attacker) {
    if (!this.alive) return;
    
    let dmg = amount * (1 - (this.baseDefense * this.defenseReductionMult * 0.02)); // 防御减伤
    dmg = Math.max(1, dmg);
    
    this.hp -= dmg;
    
    if (this.isPlayer) {
      this.game.ui.showDamageNumber(this.x - this.game.camera.x, this.y - this.game.camera.y, Math.round(dmg), '#e74c3c');
    }
    
    if (this.hp <= 0) {
      this.die(attacker);
    }
  }
  
  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
    if (this.isPlayer) {
      this.game.ui.showDamageNumber(this.x - this.game.camera.x, this.y - this.game.camera.y, Math.round(amount), '#2ecc71');
    }
  }
  
  applyPoison(dps, duration) {
    this.poisoned = true;
    this.poisonDps = Math.max(this.poisonDps, dps);
    this.poisonTimer = Math.max(this.poisonTimer, duration / 1000);
  }
  
  die(killer) {
    this.alive = false;
    this.hp = 0;
    
    // 掉落资源
    const drops = Object.entries(this.resources);
    for (const [key, amount] of drops) {
      if (amount > 0) {
        const { RESOURCES } = EVOLUTION_TREE;
        // 掉落一半资源
        for (let i = 0; i < Math.floor(amount * 0.5); i++) {
          // 简化处理：由GameEngine添加
        }
      }
    }
    
    // 击杀统计
    if (killer) {
      if (killer.isPlayer) {
        this.game.stats.kills++;
        killer.kills++;
        this.game.ui.showMessage(`击杀！ ${this.name}`, 1500);
      }
      killer.kills = (killer.kills || 0) + 1;
    }
    
    // 死亡粒子
    this.game.particles.explosion(
      this.x - this.game.camera.x,
      this.y - this.game.camera.y,
      this.color, 20
    );
    
    // 掉落资源到地图
    const allRes = Object.entries(this.resources);
    for (const [resId, amount] of allRes) {
      if (amount > 2) {
        const droppedAmount = Math.floor(amount * 0.4);
        const offset = this.size * 2;
        for (let i = 0; i < Math.min(5, droppedAmount); i++) {
          const RESOURCES_MAP = {
            meat: { id: 'meat', name: '肉类', icon: '🥩', color: '#e74c3c' },
            plant: { id: 'plant', name: '植物', icon: '🌿', color: '#27ae60' },
            water: { id: 'water', name: '水源', icon: '💧', color: '#3498db' },
            mineral: { id: 'mineral', name: '矿物', icon: '💎', color: '#9b59b6' },
            light: { id: 'light', name: '阳光', icon: '☀️', color: '#f39c12' },
            insect: { id: 'insect', name: '昆虫', icon: '🐛', color: '#8e44ad' },
            fish: { id: 'fish', name: '鱼类', icon: '🐟', color: '#1abc9c' },
            fungus: { id: 'fungus', name: '真菌', icon: '🍄', color: '#d35400' },
          };
          const { ResourceDrop } = await import('./resources.js').catch(() => ({ ResourceDrop: null }));
          // Simplified: just create drop records
        }
      }
    }
  }
  
  // ========== 技能系统 ==========
  useSkill(index) {
    if (this.silenced) {
      if (this.isPlayer) this.game.ui.showMessage('技能被沉默！', 1000);
      return;
    }
    
    if (!this.skills || !this.skills[index]) return;
    if (this.skillCooldowns[index] > 0) {
      if (this.isPlayer) this.game.ui.showMessage(`冷却中 ${this.skillCooldowns[index].toFixed(1)}s`, 800);
      return;
    }
    
    const skill = this.skills[index];
    const worldMouseX = this.game.mouse.x + this.game.camera.x;
    const worldMouseY = this.game.mouse.y + this.game.camera.y;
    
    this.executeSkill(skill, worldMouseX, worldMouseY);
    this.skillCooldowns[index] = skill.cooldown / 1000;
    
    if (this.isPlayer) {
      this.game.ui.showMessage(`${skill.icon} ${skill.name}`, 1000);
      this.game.particles.burst(this.x - this.game.camera.x, this.y - this.game.camera.y, '#f1c40f', 12);
    }
  }
  
  executeSkill(skill, targetX, targetY) {
    const effect = skill.effect;
    
    switch (skill.type) {
      case 'buff':
        if (skill.id === 'sprint') {
          this.speedMult = effect.speedMult;
          this.speedMultTimer = effect.duration / 1000;
        } else if (skill.id === 'bloodrage') {
          this.raging = true;
          this.ragingTimer = effect.duration / 1000;
          this.ragingAttackMult = effect.attackMult;
          this.currentAttack = this.baseAttack * effect.attackMult;
        }
        break;
        
      case 'dash_attack':
        // 疾风冲锋
        const dashAngle = this.facingAngle;
        const dashEnd = {
          x: this.x + Math.cos(dashAngle) * effect.dashDistance,
          y: this.y + Math.sin(dashAngle) * effect.dashDistance
        };
        this.x = dashEnd.x;
        this.y = dashEnd.y;
        this.x = Math.max(this.size, Math.min(this.game.worldWidth - this.size, this.x));
        this.y = Math.max(this.size, Math.min(this.game.worldHeight - this.size, this.y));
        this.damageEntitiesInArea(this.x, this.y, effect.width, effect.damage);
        this.game.addEffect('explosion', this.x, this.y, '#27ae60', effect.width, 500);
        break;
        
      case 'aoe':
      case 'aoe_poison':
        this.damageEntitiesInArea(this.x, this.y, effect.radius, effect.damage, effect);
        this.game.addEffect('shockwave', this.x, this.y, this.color, effect.radius, 600);
        this.game.particles.ring(this.x - this.game.camera.x, this.y - this.game.camera.y, this.color, effect.radius, 20);
        break;
        
      case 'leap':
        // 扑击
        const leapAngle = Math.atan2(targetY - this.y, targetX - this.x);
        const leapDist = Math.min(effect.range, Math.sqrt((targetX - this.x) ** 2 + (targetY - this.y) ** 2));
        this.x += Math.cos(leapAngle) * leapDist;
        this.y += Math.sin(leapAngle) * leapDist;
        this.x = Math.max(this.size, Math.min(this.game.worldWidth - this.size, this.x));
        this.y = Math.max(this.size, Math.min(this.game.worldHeight - this.size, this.y));
        // 对附近敌人造成伤害
        this.damageEntitiesInArea(this.x, this.y, this.size + 40, this.currentAttack * effect.damageMult, { stun: effect.stunDuration });
        this.game.particles.burst(this.x - this.game.camera.x, this.y - this.game.camera.y, '#e74c3c', 15);
        break;
        
      case 'teleport':
        // 幻影步
        const teleAngle = Math.atan2(targetY - this.y, targetX - this.x);
        const teleDist = Math.min(effect.range, Math.sqrt((targetX - this.x) ** 2 + (targetY - this.y) ** 2));
        this.x += Math.cos(teleAngle) * teleDist;
        this.y += Math.sin(teleAngle) * teleDist;
        this.x = Math.max(this.size, Math.min(this.game.worldWidth - this.size, this.x));
        this.y = Math.max(this.size, Math.min(this.game.worldHeight - this.size, this.y));
        this.damageEntitiesInArea(this.x, this.y, this.size + 30, effect.damage);
        this.game.particles.teleport(this.x - this.game.camera.x, this.y - this.game.camera.y, '#e67e22');
        break;
        
      case 'stealth':
        // 潜水突袭
        this.invisible = true;
        this.invisibleTimer = effect.duration / 1000;
        this.nextAttackMult = effect.nextAttackMult;
        break;
        
      case 'heal':
        // 蜕皮重生
        this.heal(effect.healAmount);
        this.stunned = false;
        this.frozen = false;
        this.poisoned = false;
        // 短暂无敌（简化：防御大幅提升）
        this.defenseReductionMult = 0.01;
        this.defenseReductionTimer = effect.invincibleDuration / 1000;
        this.game.particles.ring(this.x - this.game.camera.x, this.y - this.game.camera.y, '#8e44ad', 60, 12);
        break;
        
      case 'projectile':
      case 'projectile_debuff':
        // 毒液喷射 / 腐蚀喷射
        this.game.addProjectile(
          this, this.x, this.y, targetX, targetY,
          effect.damage, 400, 12,
          skill.id === 'venom_spray' ? '#2ecc71' : '#27ae60',
          {
            poisonDps: effect.poisonDps,
            poisonDuration: effect.poisonDuration,
            defenseReduction: effect.defenseReduction,
            duration: effect.duration,
            range: effect.range
          }
        );
        break;
        
      case 'cone':
        // 冰霜象牙 - 扇形攻击
        this.coneAttack(targetX, targetY, effect.angle, effect.range, effect.damage, { freeze: effect.freezeDuration });
        this.game.addEffect('explosion', this.x, this.y, '#85c1e9', effect.range, 600);
        break;
        
      case 'multi_hit':
        // 闪电突袭
        let hitCount = 0;
        const multiHit = () => {
          if (hitCount >= effect.hits) return;
          this.damageEntitiesInArea(this.x, this.y, this.size + 60, effect.damagePerHit);
          this.game.particles.burst(this.x - this.game.camera.x, this.y - this.game.camera.y, '#f1c40f', 5);
          hitCount++;
          setTimeout(multiHit, effect.interval);
        };
        multiHit();
        break;
        
      case 'debuff':
        // 恐惧咆哮
        this.applyDebuffToArea(this.x, this.y, effect.radius, {
          speedReduction: effect.speedReduction,
          duration: effect.duration
        });
        this.game.addEffect('shockwave', this.x, this.y, '#f39c12', effect.radius, 800);
        break;
        
      case 'execute':
        // 斩首一击
        this.executeAttack(targetX, targetY, effect);
        break;
        
      case 'parry':
        // 完美格挡
        this.parrying = true;
        this.parryTimer = effect.windowDuration / 1000;
        this.parryEffect = effect;
        this.game.particles.ring(this.x - this.game.camera.x, this.y - this.game.camera.y, '#8e44ad', 50, 10);
        // 在格挡窗口后关闭
        setTimeout(() => { this.parrying = false; }, effect.windowDuration);
        break;
        
      case 'spin_attack':
        // 刀刃风暴
        let spinHit = 0;
        const doSpin = () => {
          if (spinHit >= effect.hits) return;
          this.damageEntitiesInArea(this.x, this.y, effect.radius, effect.damagePerHit);
          this.game.particles.ring(this.x - this.game.camera.x, this.y - this.game.camera.y, '#8e44ad', effect.radius, 8);
          spinHit++;
          setTimeout(doSpin, effect.duration / effect.hits);
        };
        doSpin();
        break;
        
      case 'chain_lightning':
        // 雷霆风暴
        this.chainLightning(effect);
        break;
        
      case 'silence':
        // 电磁脉冲
        this.applyDebuffToArea(this.x, this.y, effect.radius, {
          silence: true,
          silenceDuration: effect.silenceDuration
        });
        this.game.addEffect('shockwave', this.x, this.y, '#f1c40f', effect.radius, 1000);
        break;
        
      case 'zone':
        // 深渊召唤
        this.game.addTrap(this, targetX, targetY, effect.radius, effect.damage / 6, 0, effect.duration / 1000);
        this.game.particles.ring(targetX - this.game.camera.x, targetY - this.game.camera.y, '#16a085', effect.radius, 15);
        break;
        
      case 'vision_block':
        // 墨汁迷雾 - 减速
        this.applyDebuffToArea(this.x, this.y, effect.radius, {
          speedReduction: effect.speedReduction,
          duration: effect.duration
        });
        this.game.addEffect('explosion', this.x, this.y, 'rgba(0,0,0,0.8)', effect.radius, effect.duration);
        break;
        
      case 'summon':
        // 召唤蜂群
        for (let i = 0; i < effect.count; i++) {
          const angle = (i / effect.count) * Math.PI * 2;
          const dist = 60;
          this.game.addMinion(
            this,
            this.x + Math.cos(angle) * dist,
            this.y + Math.sin(angle) * dist,
            effect.minionHp,
            effect.minionAttack,
            effect.minionSpeed
          );
        }
        break;
        
      case 'trap':
        // 蜂蜜陷阱
        this.game.addTrap(this, targetX, targetY, effect.radius, effect.dps, effect.rootDuration, effect.trapDuration / 1000);
        break;
    }
  }
  
  damageEntitiesInArea(cx, cy, radius, damage, options = {}) {
    const allEntities = [
      ...(this.game.player && this.game.player.alive && this.game.player !== this ? [this.game.player] : []),
      ...this.game.bots.filter(b => b.alive && b !== this)
    ];
    
    for (const entity of allEntities) {
      const dx = entity.x - cx;
      const dy = entity.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= radius) {
        entity.takeDamage(damage, this);
        
        if (options.knockback && dist > 0) {
          entity.vx = (dx / dist) * options.knockback;
          entity.vy = (dy / dist) * options.knockback;
        }
        
        if (options.stun) {
          entity.stunned = true;
          entity.stunTimer = options.stun / 1000;
        }
        
        if (options.freeze) {
          entity.frozen = true;
          entity.frozenTimer = options.freeze / 1000;
        }
        
        if (options.poisonDps) {
          entity.applyPoison(options.poisonDps, options.poisonDuration);
        }
      }
    }
  }
  
  applyDebuffToArea(cx, cy, radius, debuff) {
    const allEntities = [
      ...(this.game.player && this.game.player.alive && this.game.player !== this ? [this.game.player] : []),
      ...this.game.bots.filter(b => b.alive && b !== this)
    ];
    
    for (const entity of allEntities) {
      const dx = entity.x - cx;
      const dy = entity.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= radius) {
        if (debuff.speedReduction) {
          entity.speedMult = 1 - debuff.speedReduction;
          entity.speedMultTimer = debuff.duration / 1000;
        }
        if (debuff.silence) {
          entity.silenced = true;
          entity.silencedTimer = debuff.silenceDuration / 1000;
        }
      }
    }
  }
  
  coneAttack(targetX, targetY, angleDeg, range, damage, options = {}) {
    const aimAngle = Math.atan2(targetY - this.y, targetX - this.x);
    const halfAngle = (angleDeg / 2) * Math.PI / 180;
    
    const allEntities = [
      ...(this.game.player && this.game.player.alive && this.game.player !== this ? [this.game.player] : []),
      ...this.game.bots.filter(b => b.alive && b !== this)
    ];
    
    for (const entity of allEntities) {
      const dx = entity.x - this.x;
      const dy = entity.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist <= range) {
        const angle = Math.atan2(dy, dx);
        let diff = Math.abs(angle - aimAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        
        if (diff <= halfAngle) {
          entity.takeDamage(damage, this);
          if (options.freeze) {
            entity.frozen = true;
            entity.frozenTimer = options.freeze / 1000;
          }
          this.game.particles.burst(entity.x - this.game.camera.x, entity.y - this.game.camera.y, '#85c1e9', 8);
        }
      }
    }
  }
  
  chainLightning(effect) {
    const allEntities = [
      ...(this.game.player && this.game.player.alive && this.game.player !== this ? [this.game.player] : []),
      ...this.game.bots.filter(b => b.alive && b !== this)
    ];
    
    let currentTarget = null;
    let minDist = Infinity;
    for (const e of allEntities) {
      const dx = e.x - this.x;
      const dy = e.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        currentTarget = e;
      }
    }
    
    const hit = new Set();
    let prev = { x: this.x, y: this.y };
    let remaining = effect.chainCount;
    
    const chainTo = (from, target) => {
      if (!target || hit.has(target) || remaining <= 0) return;
      hit.add(target);
      remaining--;
      
      target.takeDamage(effect.damage, this);
      this.game.particles.lightning(
        from.x - this.game.camera.x, from.y - this.game.camera.y,
        target.x - this.game.camera.x, target.y - this.game.camera.y
      );
      
      // 找下一个最近未命中目标
      let nextTarget = null;
      let nextDist = effect.chainRange;
      for (const e of allEntities) {
        if (hit.has(e)) continue;
        const dx = e.x - target.x;
        const dy = e.y - target.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nextDist) {
          nextDist = dist;
          nextTarget = e;
        }
      }
      
      setTimeout(() => chainTo(target, nextTarget), 150);
    };
    
    chainTo(prev, currentTarget);
  }
  
  executeAttack(targetX, targetY, effect) {
    const allEntities = [
      ...(this.game.player && this.game.player.alive && this.game.player !== this ? [this.game.player] : []),
      ...this.game.bots.filter(b => b.alive && b !== this)
    ];
    
    for (const entity of allEntities) {
      const dx = entity.x - targetX;
      const dy = entity.y - targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 100) {
        let dmg = effect.damage;
        if (entity.hp / entity.maxHp < effect.thresholdPercent) {
          dmg = effect.damage * effect.bonusDamageMult;
          if (this.isPlayer) this.game.ui.showMessage('💀 斩首！', 1200);
        }
        entity.takeDamage(dmg, this);
        this.game.particles.burst(entity.x - this.game.camera.x, entity.y - this.game.camera.y, '#e67e22', 15);
      }
    }
  }
  
  // ========== 进化系统 ==========
  checkEvolution() {
    if (!this.isPlayer) {
      // Bot随机进化
      const speciesData = EVOLUTION_TREE[this.speciesId];
      if (speciesData && speciesData.evolvesTo && speciesData.evolvesTo.length > 0) {
        for (const nextId of speciesData.evolvesTo) {
          const req = speciesData.evolutionRequirements[nextId];
          if (req && canEvolve(this.resources, req) && Math.random() < 0.3) {
            this.evolve(nextId);
            break;
          }
        }
      }
      return;
    }
    
    // 玩家进化检测 - 自动弹出
    const speciesData = EVOLUTION_TREE[this.speciesId];
    if (!speciesData || !speciesData.evolvesTo || speciesData.evolvesTo.length === 0) return;
    
    for (const nextId of speciesData.evolvesTo) {
      const req = speciesData.evolutionRequirements[nextId];
      if (req && canEvolve(this.resources, req)) {
        if (!this._evolutionNotified) {
          this._evolutionNotified = true;
          this.game.ui.showMessage(`🧬 可以进化！按 R 键查看进化选项`, 3000);
        }
        return;
      }
    }
    this._evolutionNotified = false;
  }
  
  evolve(targetId) {
    const newData = EVOLUTION_TREE[targetId];
    if (!newData) return;
    
    const oldHpPercent = this.hp / this.maxHp;
    const oldSpecies = this.speciesId;
    
    // 消耗资源
    const speciesData = EVOLUTION_TREE[this.speciesId];
    const req = speciesData.evolutionRequirements[targetId];
    for (const [key, amount] of Object.entries(req)) {
      this.resources[key] = (this.resources[key] || 0) - amount;
    }
    
    // 应用新物种数据
    this.applySpeciesData(newData);
    this.hp = this.maxHp * oldHpPercent; // 保持血量百分比
    
    // 重置技能冷却
    this.skillCooldowns = [0, 0];
    
    if (this.isPlayer) {
      this.game.stats.evolutionCount++;
      this.game.ui.showEvolutionAnimation(oldSpecies, targetId);
      this.game.particles.evolutionBurst(
        this.x - this.game.camera.x,
        this.y - this.game.camera.y,
        newData.color
      );
    }
    
    this._evolutionNotified = false;
    this.showingEvolutionPanel = false;
  }
  
  showEvolutionPanel() {
    if (this.isPlayer) {
      this.showingEvolutionPanel = !this.showingEvolutionPanel;
      this.game.ui.toggleEvolutionPanel(this.showingEvolutionPanel);
    }
  }
  
  // ========== 渲染 ==========
  render(ctx, camera) {
    const screenX = this.x - camera.x;
    const screenY = this.y - camera.y;
    
    // 可见范围裁剪
    if (screenX < -100 || screenX > ctx.canvas.width + 100 ||
        screenY < -100 || screenY > ctx.canvas.height + 100) return;
    
    // 隐身时透明
    if (this.invisible) {
      ctx.globalAlpha = this.isPlayer ? 0.4 : 0.15;
    }
    
    // 冻结效果
    if (this.frozen) {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#85c1e9';
    }
    
    // 狂暴效果
    if (this.raging) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#e74c3c';
    }
    
    // 绘制身体
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.isPlayer ? '#f1c40f' : '#2c3e50';
    ctx.lineWidth = this.isPlayer ? 3 : 2;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // 朝向指示（小尖角）
    ctx.fillStyle = this.isPlayer ? '#f1c40f' : '#ecf0f1';
    ctx.beginPath();
    ctx.arc(
      screenX + Math.cos(this.facingAngle) * (this.size * 0.7),
      screenY + Math.sin(this.facingAngle) * (this.size * 0.7),
      this.size * 0.3, 0, Math.PI * 2
    );
    ctx.fill();
    
    // 物种图标
    ctx.shadowBlur = 0;
    ctx.font = `${this.size * 1.1}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.icon, screenX, screenY);
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    
    // HP条
    this.renderHPBar(ctx, screenX, screenY);
    
    // 中毒显示
    if (this.poisoned) {
      ctx.fillStyle = '#2ecc71';
      ctx.font = '12px serif';
      ctx.textAlign = 'center';
      ctx.fillText('☠️', screenX + this.size, screenY - this.size);
    }
    
    // 名字
    if (!this.isPlayer) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(this.name, screenX, screenY - this.size - 14);
    }
  }
  
  renderHPBar(ctx, screenX, screenY) {
    const barW = this.size * 2.4;
    const barH = 6;
    const bx = screenX - barW / 2;
    const by = screenY - this.size - 12;
    
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    
    const hpPercent = Math.max(0, this.hp / this.maxHp);
    const hpColor = hpPercent > 0.5 ? '#2ecc71' : hpPercent > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillStyle = hpColor;
    ctx.fillRect(bx, by, barW * hpPercent, barH);
  }
}
