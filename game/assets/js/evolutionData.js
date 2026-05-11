/**
 * 进化数据系统
 * 定义所有物种、进化路径、物资需求
 */

// ========== 物资类型 ==========
const RESOURCES = {
  MEAT: { id: 'meat', name: '肉类', icon: '🥩', color: '#e74c3c' },
  PLANT: { id: 'plant', name: '植物', icon: '🌿', color: '#27ae60' },
  WATER: { id: 'water', name: '水源', icon: '💧', color: '#3498db' },
  MINERAL: { id: 'mineral', name: '矿物', icon: '💎', color: '#9b59b6' },
  LIGHT: { id: 'light', name: '阳光', icon: '☀️', color: '#f39c12' },
  INSECT: { id: 'insect', name: '昆虫', icon: '🐛', color: '#8e44ad' },
  FISH: { id: 'fish', name: '鱼类', icon: '🐟', color: '#1abc9c' },
  FUNGUS: { id: 'fungus', name: '真菌', icon: '🍄', color: '#d35400' },
};

// ========== 物种进化树 ==========
// 初始形态 -> 一级进化(需要收集特定物资) -> 二级进化
const EVOLUTION_TREE = {

  // ===== 初始形态 =====
  PRIMORDIAL: {
    id: 'PRIMORDIAL',
    name: '原始生物',
    icon: '🦠',
    tier: 0,
    color: '#95a5a6',
    hp: 80,
    speed: 3,
    attack: 8,
    defense: 3,
    size: 20,
    moveType: 'walk',
    description: '所有生命的起点，脆弱但充满可能。',
    defaultAttack: { name: '撞击', damage: 8, range: 25, cooldown: 800 },
    skills: [],
    evolvesTo: ['HERBIVORE', 'CARNIVORE', 'AQUATIC', 'INSECTOID'],
    evolutionRequirements: {
      HERBIVORE: { plant: 8, water: 5 },
      CARNIVORE: { meat: 8, mineral: 3 },
      AQUATIC: { water: 10, fish: 4 },
      INSECTOID: { insect: 8, fungus: 4 },
    }
  },

  // ===== 一级进化：植食者 =====
  HERBIVORE: {
    id: 'HERBIVORE',
    name: '食草兽',
    icon: '🦌',
    tier: 1,
    color: '#27ae60',
    hp: 120,
    speed: 4.5,
    attack: 12,
    defense: 6,
    size: 28,
    moveType: 'walk',
    description: '以植物为食，速度极快，善于逃跑和奔袭。',
    defaultAttack: { name: '顶角', damage: 12, range: 30, cooldown: 700 },
    skills: [
      {
        id: 'sprint',
        name: '疾风冲锋',
        icon: '💨',
        description: '短时间内速度提升300%，持续2秒',
        cooldown: 8000,
        type: 'buff',
        effect: { speedMult: 3, duration: 2000 }
      },
      {
        id: 'stampede',
        name: '群兽践踏',
        icon: '🐾',
        description: '向前冲刺并对路径上的敌人造成大量伤害',
        cooldown: 12000,
        type: 'dash_attack',
        effect: { damage: 35, dashDistance: 300, width: 60 }
      }
    ],
    evolvesTo: ['MAMMOTH', 'RAPTOR'],
    evolutionRequirements: {
      MAMMOTH: { plant: 20, mineral: 15, water: 10 },
      RAPTOR: { plant: 15, meat: 10, light: 12 },
    }
  },

  // ===== 一级进化：肉食者 =====
  CARNIVORE: {
    id: 'CARNIVORE',
    name: '掠食者',
    icon: '🐺',
    tier: 1,
    color: '#e74c3c',
    hp: 110,
    speed: 4,
    attack: 20,
    defense: 5,
    size: 26,
    moveType: 'walk',
    description: '残暴的猎食者，攻击力强悍，擅长追踪猎物。',
    defaultAttack: { name: '利爪撕裂', damage: 20, range: 35, cooldown: 600 },
    skills: [
      {
        id: 'bloodrage',
        name: '嗜血狂怒',
        icon: '🩸',
        description: '进入狂暴状态，攻击力+80%，持续3秒，击杀时恢复15HP',
        cooldown: 10000,
        type: 'buff',
        effect: { attackMult: 1.8, duration: 3000, killHeal: 15 }
      },
      {
        id: 'pounce',
        name: '猎豹扑击',
        icon: '🐆',
        description: '向目标扑去，造成3倍攻击力伤害并将其击晕0.8秒',
        cooldown: 9000,
        type: 'leap',
        effect: { damageMult: 3, stunDuration: 800, range: 250 }
      }
    ],
    evolvesTo: ['SABERTOOTH', 'VENOM_BEAST'],
    evolutionRequirements: {
      SABERTOOTH: { meat: 25, mineral: 12, insect: 8 },
      VENOM_BEAST: { meat: 20, fungus: 15, insect: 10 },
    }
  },

  // ===== 一级进化：水栖者 =====
  AQUATIC: {
    id: 'AQUATIC',
    name: '水栖兽',
    icon: '🐊',
    tier: 1,
    color: '#1abc9c',
    hp: 130,
    speed: 3.5,
    attack: 15,
    defense: 8,
    size: 30,
    moveType: 'swim',
    description: '水陆两栖，在水中速度翻倍，防御极高。',
    defaultAttack: { name: '撕咬', damage: 15, range: 35, cooldown: 750 },
    skills: [
      {
        id: 'dive',
        name: '潜水突袭',
        icon: '🌊',
        description: '潜入水中隐身，下次攻击造成250%伤害',
        cooldown: 10000,
        type: 'stealth',
        effect: { duration: 4000, nextAttackMult: 2.5 }
      },
      {
        id: 'tidal_wave',
        name: '潮汐冲击',
        icon: '💦',
        description: '释放水流冲击，推开周围所有敌人并造成伤害',
        cooldown: 14000,
        type: 'aoe',
        effect: { damage: 30, radius: 180, knockback: 200 }
      }
    ],
    evolvesTo: ['LEVIATHAN', 'ELECTRIC_EEL'],
    evolutionRequirements: {
      LEVIATHAN: { water: 25, fish: 18, mineral: 10 },
      ELECTRIC_EEL: { water: 20, fish: 12, mineral: 15 },
    }
  },

  // ===== 一级进化：虫形者 =====
  INSECTOID: {
    id: 'INSECTOID',
    name: '虫形体',
    icon: '🦂',
    tier: 1,
    color: '#8e44ad',
    hp: 90,
    speed: 4.2,
    attack: 14,
    defense: 7,
    size: 22,
    moveType: 'crawl',
    description: '拥有坚硬外壳和毒刺，移动灵活，善用地形。',
    defaultAttack: { name: '毒刺穿刺', damage: 14, range: 30, cooldown: 650 },
    skills: [
      {
        id: 'molt',
        name: '蜕皮重生',
        icon: '🐚',
        description: '脱去受损外壳，恢复25HP并获得短暂无敌',
        cooldown: 12000,
        type: 'heal',
        effect: { healAmount: 25, invincibleDuration: 1500 }
      },
      {
        id: 'venom_spray',
        name: '毒液喷射',
        icon: '☠️',
        description: '喷射毒雾，命中的敌人持续中毒5秒',
        cooldown: 9000,
        type: 'projectile',
        effect: { damage: 8, poisonDps: 6, poisonDuration: 5000, range: 200 }
      }
    ],
    evolvesTo: ['MANTIS_LORD', 'QUEEN_BEE'],
    evolutionRequirements: {
      MANTIS_LORD: { insect: 22, mineral: 18, meat: 8 },
      QUEEN_BEE: { insect: 20, plant: 15, light: 12 },
    }
  },

  // ===== 二级进化：猛犸象 =====
  MAMMOTH: {
    id: 'MAMMOTH',
    name: '远古猛犸',
    icon: '🦣',
    tier: 2,
    color: '#795548',
    hp: 280,
    speed: 3.2,
    attack: 28,
    defense: 18,
    size: 48,
    moveType: 'walk',
    description: '移动的堡垒，血量和防御冠绝群雄，踩踏无敌。',
    defaultAttack: { name: '象牙横扫', damage: 28, range: 55, cooldown: 1000 },
    skills: [
      {
        id: 'earthquake',
        name: '地震踩踏',
        icon: '🌍',
        description: '猛烈踩踏大地，范围内所有敌人受到大量伤害并被击飞',
        cooldown: 15000,
        type: 'aoe',
        effect: { damage: 60, radius: 220, knockback: 300, stunDuration: 1000 }
      },
      {
        id: 'ice_tusk',
        name: '冰霜象牙',
        icon: '❄️',
        description: '以冰霜力量横扫前方扇形区域，造成伤害并冻结敌人',
        cooldown: 11000,
        type: 'cone',
        effect: { damage: 45, angle: 120, range: 160, freezeDuration: 2000 }
      }
    ],
    evolvesTo: [],
    evolutionRequirements: {}
  },

  // ===== 二级进化：奔袭龙 =====
  RAPTOR: {
    id: 'RAPTOR',
    name: '迅猛龙',
    icon: '🦖',
    tier: 2,
    color: '#f39c12',
    hp: 200,
    speed: 6.5,
    attack: 35,
    defense: 10,
    size: 38,
    moveType: 'walk',
    description: '速度最快的陆地捕食者，攻击迅如闪电。',
    defaultAttack: { name: '迅速啄击', damage: 35, range: 40, cooldown: 400 },
    skills: [
      {
        id: 'lightning_rush',
        name: '闪电突袭',
        icon: '⚡',
        description: '以极速连续穿刺5次，每次造成攻击力伤害',
        cooldown: 10000,
        type: 'multi_hit',
        effect: { hits: 5, damagePerHit: 30, interval: 150 }
      },
      {
        id: 'terror_roar',
        name: '恐惧咆哮',
        icon: '😱',
        description: '释放恐惧声浪，范围内敌人速度降低60%持续3秒',
        cooldown: 12000,
        type: 'debuff',
        effect: { radius: 200, speedReduction: 0.6, duration: 3000 }
      }
    ],
    evolvesTo: [],
    evolutionRequirements: {}
  },

  // ===== 二级进化：剑齿虎 =====
  SABERTOOTH: {
    id: 'SABERTOOTH',
    name: '剑齿猛虎',
    icon: '🐯',
    tier: 2,
    color: '#e67e22',
    hp: 230,
    speed: 5.5,
    attack: 50,
    defense: 12,
    size: 42,
    moveType: 'walk',
    description: '最强的单体输出，剑齿一击可洞穿任何防御。',
    defaultAttack: { name: '剑齿撕裂', damage: 50, range: 45, cooldown: 700 },
    skills: [
      {
        id: 'executioner',
        name: '斩首一击',
        icon: '⚔️',
        description: '对生命值低于30%的目标造成额外200%伤害',
        cooldown: 8000,
        type: 'execute',
        effect: { thresholdPercent: 0.3, bonusDamageMult: 3.0, damage: 60 }
      },
      {
        id: 'shadow_step',
        name: '幻影步',
        icon: '👁️',
        description: '瞬间移动到目标身后并发动偷袭，造成双倍暴击',
        cooldown: 10000,
        type: 'teleport',
        effect: { damage: 80, range: 300, backstabMult: 2.0 }
      }
    ],
    evolvesTo: [],
    evolutionRequirements: {}
  },

  // ===== 二级进化：毒牙兽 =====
  VENOM_BEAST: {
    id: 'VENOM_BEAST',
    name: '毒牙狂兽',
    icon: '🐍',
    tier: 2,
    color: '#2ecc71',
    hp: 210,
    speed: 5,
    attack: 38,
    defense: 14,
    size: 36,
    moveType: 'slither',
    description: '毒素无处不在，每次攻击必定带毒，让猎物在痛苦中死去。',
    defaultAttack: { name: '毒牙噬咬', damage: 38, range: 40, cooldown: 650, poison: { dps: 8, duration: 4000 } },
    skills: [
      {
        id: 'toxic_nova',
        name: '毒素爆发',
        icon: '💚',
        description: '以自身为中心爆发毒素，范围内敌人中剧毒持续8秒',
        cooldown: 12000,
        type: 'aoe_poison',
        effect: { radius: 200, poisonDps: 15, poisonDuration: 8000 }
      },
      {
        id: 'acid_spit',
        name: '腐蚀喷射',
        icon: '🟢',
        description: '喷射强力腐蚀液，溶解敌人防御使其降低50%持续4秒',
        cooldown: 9000,
        type: 'projectile_debuff',
        effect: { damage: 20, defenseReduction: 0.5, duration: 4000, range: 280 }
      }
    ],
    evolvesTo: [],
    evolutionRequirements: {}
  },

  // ===== 二级进化：海怪 =====
  LEVIATHAN: {
    id: 'LEVIATHAN',
    name: '深海利维坦',
    icon: '🦑',
    tier: 2,
    color: '#16a085',
    hp: 300,
    speed: 4,
    attack: 40,
    defense: 20,
    size: 52,
    moveType: 'swim',
    description: '来自深渊的巨兽，横亘整个战场的触手让人绝望。',
    defaultAttack: { name: '触手横扫', damage: 40, range: 70, cooldown: 900 },
    skills: [
      {
        id: 'deep_abyss',
        name: '深渊召唤',
        icon: '🌑',
        description: '在目标区域召唤深渊漩涡，持续6秒吸引并伤害敌人',
        cooldown: 16000,
        type: 'zone',
        effect: { damage: 20, pullForce: 150, duration: 6000, radius: 160 }
      },
      {
        id: 'ink_cloud',
        name: '墨汁迷雾',
        icon: '🖤',
        description: '喷射大量墨汁，完全遮挡视野并减速范围内所有敌人',
        cooldown: 11000,
        type: 'vision_block',
        effect: { radius: 250, speedReduction: 0.5, duration: 5000 }
      }
    ],
    evolvesTo: [],
    evolutionRequirements: {}
  },

  // ===== 二级进化：电鳗龙 =====
  ELECTRIC_EEL: {
    id: 'ELECTRIC_EEL',
    name: '电鳗龙',
    icon: '⚡',
    tier: 2,
    color: '#f1c40f',
    hp: 190,
    speed: 5.5,
    attack: 42,
    defense: 10,
    size: 34,
    moveType: 'swim',
    description: '以生物电为武器，在水中无人能敌，放电秒杀一切。',
    defaultAttack: { name: '电击', damage: 42, range: 50, cooldown: 600 },
    skills: [
      {
        id: 'thunder_storm',
        name: '雷霆风暴',
        icon: '🌩️',
        description: '以自身为中心释放连环闪电，在敌人之间弹射伤害',
        cooldown: 12000,
        type: 'chain_lightning',
        effect: { damage: 45, chainCount: 4, chainRange: 200 }
      },
      {
        id: 'emp',
        name: '电磁脉冲',
        icon: '📡',
        description: '释放EMP脉冲，沉默范围内所有敌人技能持续3秒',
        cooldown: 14000,
        type: 'silence',
        effect: { radius: 280, silenceDuration: 3000 }
      }
    ],
    evolvesTo: [],
    evolutionRequirements: {}
  },

  // ===== 二级进化：螳螂领主 =====
  MANTIS_LORD: {
    id: 'MANTIS_LORD',
    name: '螳螂领主',
    icon: '🦗',
    tier: 2,
    color: '#8e44ad',
    hp: 180,
    speed: 5,
    attack: 45,
    defense: 16,
    size: 36,
    moveType: 'crawl',
    description: '刀锋一般的前肢，闪避和反击是其生存之道。',
    defaultAttack: { name: '双刃横斩', damage: 45, range: 50, cooldown: 550 },
    skills: [
      {
        id: 'counter',
        name: '完美格挡',
        icon: '🛡️',
        description: '在0.5秒内格挡所有攻击，格挡成功后立即反击造成双倍伤害',
        cooldown: 8000,
        type: 'parry',
        effect: { windowDuration: 500, counterDamageMult: 2.0, counterDamage: 70 }
      },
      {
        id: 'blade_storm',
        name: '刀刃风暴',
        icon: '🌪️',
        description: '以极高速度旋转斩击，命中所有周围敌人8次',
        cooldown: 13000,
        type: 'spin_attack',
        effect: { hits: 8, damagePerHit: 25, radius: 100, duration: 1200 }
      }
    ],
    evolvesTo: [],
    evolutionRequirements: {}
  },

  // ===== 二级进化：蜂后 =====
  QUEEN_BEE: {
    id: 'QUEEN_BEE',
    name: '蜂后',
    icon: '🐝',
    tier: 2,
    color: '#f39c12',
    hp: 170,
    speed: 6,
    attack: 32,
    defense: 12,
    size: 30,
    moveType: 'fly',
    description: '唯一能飞行的物种，可以忽略大部分地形，蜂群战术无解。',
    defaultAttack: { name: '蜂刺穿刺', damage: 32, range: 35, cooldown: 500 },
    skills: [
      {
        id: 'swarm',
        name: '召唤蜂群',
        icon: '🐝',
        description: '召唤10只工蜂跟随，每只工蜂有独立攻击能力',
        cooldown: 15000,
        type: 'summon',
        effect: { count: 10, minionHp: 30, minionAttack: 8, minionSpeed: 4 }
      },
      {
        id: 'honey_trap',
        name: '蜂蜜陷阱',
        icon: '🍯',
        description: '在地面留下蜂蜜陷阱，踩中的敌人被粘住且持续受到伤害',
        cooldown: 9000,
        type: 'trap',
        effect: { damage: 10, dps: 12, rootDuration: 3000, trapDuration: 20000, radius: 80 }
      }
    ],
    evolvesTo: [],
    evolutionRequirements: {}
  },
};

// 工具函数：获取进化需求的显示文本
function getEvolutionRequirementText(requirements) {
  return Object.entries(requirements).map(([resource, amount]) => {
    const res = RESOURCES[resource.toUpperCase()];
    return `${res ? res.icon : '❓'}${res ? res.name : resource} x${amount}`;
  }).join('  ');
}

// 工具函数：检查是否满足进化条件
function canEvolve(collectedResources, requirements) {
  for (const [resource, amount] of Object.entries(requirements)) {
    if ((collectedResources[resource] || 0) < amount) return false;
  }
  return true;
}

export { RESOURCES, EVOLUTION_TREE, getEvolutionRequirementText, canEvolve };
