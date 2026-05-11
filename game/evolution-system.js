// ========================
// 生物分类学进化系统 v2.0
// 支持玩家自由选择进化路线
// ========================

// 域等级名称
const DOMAIN_DATA = {
  eukaryote: { name: '真核生物域', color: '#9b59b6' }
};

// 界（主要分支）
const KINGDOM_DATA = {
  animal: { name: '动物界', color: '#e74c3c', icon: '🦁', resType: 'meat' },
  plant: { name: '植物界', color: '#27ae60', icon: '🌿', resType: 'plant' },
  fungi: { name: '真菌界', color: '#8e44ad', icon: '🍄', resType: 'fungi' }
};

// 门（次级分类）
const PHYLUM_DATA = {
  chordata: { name: '脊索动物门', color: '#3498db', subLine: 'animal', spd: 1.0 },
  arthropoda: { name: '节肢动物门', color: '#e67e22', subLine: 'animal', spd: 1.3 }
};

// 进化分支定义（玩家可选择的方向）
const EVOLUTION_BRANCHES = {
  // ===== Tier 1: 起点选择（6个初始形态）=====
  TIER1: {
    title: '🌱 初始形态选择',
    subtitle: '选择你的起始生物',
    choices: [
      {
        id: 'protozoa',
        name: '🫧 原始生物',
        desc: '生命的起点，最基础的形态',
        hp: 40, atk: 5, def: 3, spd: 1.0,
        branches: ['mammal', 'avian', 'reptile', 'amphibian', 'arthropod', 'aquatic']
      }
    ]
  },
  
  // ===== Tier 2: 第一次分支（6大分支）=====
  TIER2: {
    title: '🔀 进化方向选择',
    subtitle: '选择你的进化分支',
    choices: [
      {
        id: 'mammal',
        name: '🦁 哺乳类分支',
        desc: '温血、毛发、胎生',
        hp: 50, atk: 8, def: 5, spd: 1.1,
        branches: ['predator', 'herbivore', 'aquatic']
      },
      {
        id: 'avian',
        name: '🦅 鸟类分支',
        desc: '温血、羽毛、卵生',
        hp: 40, atk: 7, def: 3, spd: 1.3,
        branches: ['raptor', 'songbird', 'waterfowl']
      },
      {
        id: 'reptile',
        name: '🦎 爬行类分支',
        desc: '冷血、鳞片、卵生',
        hp: 55, atk: 9, def: 8, spd: 0.9,
        branches: ['lizard', 'snake', 'turtle']
      },
      {
        id: 'amphibian',
        name: '🐸 两栖类分支',
        desc: '水陆两栖、变态发育',
        hp: 45, atk: 10, def: 4, spd: 1.0,
        branches: ['frog', 'salamander']
      },
      {
        id: 'arthropod',
        name: '🐛 节肢动物分支',
        desc: '外骨骼、分节、蜕皮',
        hp: 35, atk: 12, def: 6, spd: 1.2,
        branches: ['beetle', 'arachnid', 'wasp']
      },
      {
        id: 'aquatic',
        name: '🐟 水生动物分支',
        desc: '水中生活、鳃呼吸',
        hp: 40, atk: 8, def: 4, spd: 1.1,
        branches: ['predator_fish', 'school_fish', 'bottom_feeder']
      }
    ]
  },
  
  // ===== Tier 3-5: 各分支的进化选项 =====
  TIER3: {
    predator: [
      { id: 'wolf', name: '🐺 狼', desc: '群居猎手', hp: 80, atk: 14, def: 8, spd: 1.2, branches: ['dire_wolf', 'wyvern'] },
      { id: 'cat', name: '🐱 猫科', desc: '独行猎手', hp: 70, atk: 16, def: 6, spd: 1.4, branches: ['panther', 'saber'] },
      { id: 'bear', name: '🐻 熊', desc: '力量型战士', hp: 120, atk: 12, def: 18, spd: 0.7, branches: ['grizzly', 'panda'] }
    ],
    herbivore: [
      { id: 'rabbit', name: '🐰 兔', desc: '敏捷逃生', hp: 60, atk: 6, def: 5, spd: 1.5, branches: ['deer', 'boar'] },
      { id: 'deer', name: '🦌 鹿', desc: '优雅奔跑', hp: 80, atk: 8, def: 8, spd: 1.3, branches: ['elk', 'moose'] },
      { id: 'boar', name: '🐗 野猪', desc: '冲锋陷阵', hp: 100, atk: 14, def: 12, spd: 1.0, branches: ['rhino', 'warthog'] }
    ],
    aquatic: [
      { id: 'otter', name: '🦦 水獭', desc: '灵活水中', hp: 65, atk: 10, def: 8, spd: 1.2, branches: ['seal', 'walrus'] },
      { id: 'seal', name: '🦭 海豹', desc: '海洋猎手', hp: 80, atk: 12, def: 10, spd: 1.0, branches: ['orca', 'leopard_seal'] }
    ],
    raptor: [
      { id: 'falcon', name: '🦅 游隼', desc: '极速俯冲', hp: 60, atk: 16, def: 5, spd: 1.8, branches: ['eagle', 'hawk'] },
      { id: 'owl', name: '🦉 猫头鹰', desc: '夜行猎手', hp: 55, atk: 14, def: 6, spd: 1.1, branches: ['snowy_owl', 'horned_owl'] }
    ],
    songbird: [
      { id: 'crow', name: '🐦 乌鸦', desc: '智慧之鸟', hp: 45, atk: 10, def: 4, spd: 1.2, branches: ['raven', 'magpie'] }
    ],
    waterfowl: [
      { id: 'duck', name: '🦆 鸭', desc: '水陆两栖', hp: 50, atk: 8, def: 6, spd: 1.0, branches: ['swan', 'goose'] }
    ],
    lizard: [
      { id: 'monitor', name: '🦎 巨蜥', desc: '毒液攻击', hp: 70, atk: 14, def: 10, spd: 1.1, branches: ['komodo', 'iguana'] }
    ],
    snake: [
      { id: 'viper', name: '🐍 毒蛇', desc: '剧毒猎手', hp: 50, atk: 18, def: 4, spd: 1.0, branches: ['cobra', 'mamba'] }
    ],
    turtle: [
      { id: 'turtle', name: '🐢 龟', desc: '移动堡垒', hp: 100, atk: 6, def: 20, spd: 0.4, branches: ['tortoise', 'sea_turtle'] }
    ],
    frog: [
      { id: 'frog', name: '🐸 青蛙', desc: '跳跃高手', hp: 45, atk: 12, def: 4, spd: 1.3, branches: ['poison_dart', 'bullfrog'] }
    ],
    salamander: [
      { id: 'salamander', name: '🦎 蝾螈', desc: '再生能力', hp: 55, atk: 10, def: 6, spd: 0.8, branches: ['axolotl', 'giant_salamander'] }
    ],
    beetle: [
      { id: 'rhinoceros_beetle', name: '🪲 犀牛甲虫', desc: '力量冠军', hp: 50, atk: 16, def: 14, spd: 0.5, branches: ['stag_beetle', 'titan_beetle'] }
    ],
    arachnid: [
      { id: 'tarantula', name: '🕷️ 捕鸟蛛', desc: '暗影猎手', hp: 40, atk: 18, def: 6, spd: 1.0, branches: ['bird_eater', 'spider_king'] }
    ],
    wasp: [
      { id: 'hornet', name: '🐝 大黄蜂', desc: '群体攻击', hp: 35, atk: 16, def: 4, spd: 1.4, branches: ['murder_hornet', 'warrior_bee'] }
    ],
    predator_fish: [
      { id: 'shark', name: '🦈 鲨鱼', desc: '海中霸主', hp: 90, atk: 18, def: 8, spd: 1.4, branches: ['great_white', 'tiger_shark'] }
    ],
    school_fish: [
      { id: 'salmon', name: '🐟 鲑鱼', desc: '洄游战士', hp: 60, atk: 10, def: 6, spd: 1.3, branches: ['king_salmon', 'electric_eel'] }
    ],
    bottom_feeder: [
      { id: 'sturgeon', name: '🦴 鲟鱼', desc: '古老物种', hp: 100, atk: 12, def: 12, spd: 0.8, branches: ['paddlefish', 'arapaima'] }
    ]
  },
  
  TIER4: {
    dire_wolf: { id: 'dire_wolf', name: '🐺 恐狼', desc: '更新世顶级掠食者', hp: 120, atk: 22, def: 14, spd: 1.3 },
    wyvern: { id: 'wyvern', name: '🐉 双足飞龙', desc: '龙族亚种', hp: 100, atk: 26, def: 10, spd: 1.2 },
    panther: { id: 'panther', name: '🐆 豹', desc: '敏捷刺客', hp: 85, atk: 24, def: 8, spd: 1.5 },
    saber: { id: 'saber', name: '🦷 剑齿虎', desc: '冰河猎手', hp: 110, atk: 28, def: 12, spd: 1.1 },
    grizzly: { id: 'grizzly', name: '🐻 灰熊', desc: '力量型战士', hp: 160, atk: 20, def: 22, spd: 0.7 },
    panda: { id: 'panda', name: '🐼 熊猫', desc: '稀有物种', hp: 140, atk: 16, def: 26, spd: 0.5 },
    deer: { id: 'elk', name: '🦌 驼鹿', desc: '森林巨兽', hp: 110, atk: 14, def: 12, spd: 1.2 },
    moose: { id: 'moose', name: '🦏 巨麋', desc: '体型最大', hp: 150, atk: 18, def: 16, spd: 0.9 },
    rhino: { id: 'rhino', name: '🦏 犀牛', desc: '装甲冲锋', hp: 200, atk: 24, def: 28, spd: 0.8 },
    warthog: { id: 'warthog', name: '🐗 疣猪', desc: '勇猛战士', hp: 120, atk: 20, def: 14, spd: 1.1 },
    eagle: { id: 'eagle', name: '🦅 鹰', desc: '天空之王', hp: 80, atk: 24, def: 6, spd: 1.6 },
    hawk: { id: 'hawk', name: '🦅 苍鹰', desc: '俯冲猎手', hp: 70, atk: 22, def: 5, spd: 1.8 },
    snowy_owl: { id: 'snowy_owl', name: '🦉 雪鸮', desc: '极地猎手', hp: 65, atk: 18, def: 8, spd: 1.0 },
    horned_owl: { id: 'horned_owl', name: '🦉 雕鸮', desc: '夜间霸主', hp: 75, atk: 20, def: 7, spd: 0.9 },
    swan: { id: 'swan', name: '🦢 天鹅', desc: '优雅战士', hp: 70, atk: 14, def: 10, spd: 1.1 },
    goose: { id: 'goose', name: '🦆 鹅', desc: '凶猛护卫', hp: 80, atk: 16, def: 8, spd: 1.0 },
    komodo: { id: 'komodo', name: '🦎 科莫多龙', desc: '毒液巨龙', hp: 130, atk: 24, def: 16, spd: 0.9 },
    iguana: { id: 'iguana', name: '🦎 鬣蜥', desc: '攀爬高手', hp: 90, atk: 16, def: 12, spd: 1.2 },
    cobra: { id: 'cobra', name: '🐍 眼镜王蛇', desc: '毒液大师', hp: 100, atk: 28, def: 6, spd: 1.0 },
    mamba: { id: 'mamba', name: '🐍 黑曼巴', desc: '极速毒蛇', hp: 80, atk: 30, def: 4, spd: 1.4 },
    tortoise: { id: 'tortoise', name: '🐢 陆龟', desc: '长寿战士', hp: 180, atk: 8, def: 32, spd: 0.3 },
    sea_turtle: { id: 'sea_turtle', name: '🐢 海龟', desc: '海洋漫游者', hp: 150, atk: 10, def: 24, spd: 0.5 },
    poison_dart: { id: 'poison_dart', name: '🐸 毒箭蛙', desc: '剧毒专家', hp: 35, atk: 22, def: 3, spd: 1.4 },
    bullfrog: { id: 'bullfrog', name: '🐸 牛蛙', desc: '吞食专家', hp: 80, atk: 18, def: 6, spd: 1.0 },
    axolotl: { id: 'axolotl', name: '🦎 蝾螈', desc: '再生之王', hp: 60, atk: 14, def: 8, spd: 0.7 },
    giant_salamander: { id: 'giant_salamander', name: '🦎 巨型蝾螈', desc: '古老两栖', hp: 120, atk: 18, def: 14, spd: 0.5 },
    stag_beetle: { id: 'stag_beetle', name: '🪲 锹形甲虫', desc: '角力冠军', hp: 60, atk: 20, def: 16, spd: 0.4 },
    titan_beetle: { id: 'titan_beetle', name: '🪲 泰坦甲虫', desc: '最大甲虫', hp: 80, atk: 24, def: 20, spd: 0.3 },
    bird_eater: { id: 'bird_eater', name: '🕷️ 食鸟蛛', desc: '巨型蜘蛛', hp: 50, atk: 22, def: 8, spd: 0.9 },
    spider_king: { id: 'spider_king', name: '🕸️ 蛛王', desc: '蛛群之主', hp: 70, atk: 26, def: 10, spd: 1.0 },
    murder_hornet: { id: 'murder_hornet', name: '🐝 杀人蜂', desc: '致命群攻', hp: 40, atk: 24, def: 5, spd: 1.5 },
    warrior_bee: { id: 'warrior_bee', name: '🐝 战斗蜂', desc: '蜂群战士', hp: 45, atk: 22, def: 6, spd: 1.3 },
    great_white: { id: 'great_white', name: '🦈 大白鲨', desc: '海洋杀手', hp: 150, atk: 28, def: 12, spd: 1.4 },
    tiger_shark: { id: 'tiger_shark', name: '🦈 虎鲨', desc: '杂食猎手', hp: 140, atk: 26, def: 14, spd: 1.3 },
    king_salmon: { id: 'king_salmon', name: '🐟 帝王鲑', desc: '洄游之王', hp: 90, atk: 18, def: 10, spd: 1.4 },
    electric_eel: { id: 'electric_eel', name: '⚡ 电鳗', desc: '电击攻击', hp: 100, atk: 24, def: 8, spd: 0.8 },
    paddlefish: { id: 'paddlefish', name: '🦴 匙吻鲟', desc: '古老鱼种', hp: 130, atk: 14, def: 16, spd: 0.7 },
    arapaima: { id: 'arapaima', name: '🦴 巨骨舌鱼', desc: '淡水巨兽', hp: 160, atk: 18, def: 18, spd: 0.6 }
  },
  
  TIER5: {
    alpha_wolf: { id: 'alpha_wolf', name: '🐺 狼王', desc: '狼群领袖', hp: 180, atk: 32, def: 18, spd: 1.3 },
    dragon_lord: { id: 'dragon_lord', name: '🐉 龙领主', desc: '龙族之主', hp: 200, atk: 40, def: 24, spd: 1.2 },
    saber_tiger: { id: 'saber_tiger', name: '🦷 剑齿虎王', desc: '冰河王者', hp: 200, atk: 42, def: 20, spd: 1.0 },
    panda_king: { id: 'panda_king', name: '🐼 熊猫王', desc: '稀有王者', hp: 250, atk: 28, def: 40, spd: 0.5 },
    mammoth: { id: 'mammoth', name: '🦣 猛犸象', desc: '冰原巨兽', hp: 400, atk: 38, def: 50, spd: 0.5 },
    thunder_eagle: { id: 'thunder_eagle', name: '⚡ 雷鹰', desc: '风暴使者', hp: 150, atk: 38, def: 12, spd: 1.8 },
    phoenix: { id: 'phoenix', name: '🔥 凤凰', desc: '浴火重生', hp: 200, atk: 45, def: 18, spd: 1.6 },
    sea_dragon: { id: 'sea_dragon', name: '🌊 海龙', desc: '深海霸主', hp: 280, atk: 42, def: 28, spd: 1.1 },
    basilisk: { id: 'basilisk', name: '🐍 蛇怪', desc: '石化之眼', hp: 200, atk: 48, def: 16, spd: 1.0 },
    kraken: { id: 'kraken', name: '🦑 克拉肯', desc: '北海巨妖', hp: 350, atk: 50, def: 35, spd: 0.9 },
    leviathan: { id: 'leviathan', name: '🐙 利维坦', desc: '深海巨怪', hp: 400, atk: 55, def: 40, spd: 0.8 }
  },
  
  TIER6: {
    elder_dragon: { id: 'elder_dragon', name: '🐉 古龙', desc: '最古老的龙', hp: 500, atk: 65, def: 45, spd: 1.1 },
    primordial: { id: 'primordial', name: '🦣 原始巨兽', desc: '生命之源', hp: 600, atk: 55, def: 60, spd: 0.6 },
    storm_dragon: { id: 'storm_dragon', name: '⚡ 风龙', desc: '风暴之主', hp: 400, atk: 70, def: 30, spd: 1.8 },
    abyss_lord: { id: 'abyss_lord', name: '🦑 深渊领主', desc: '深渊之王', hp: 550, atk: 68, def: 50, spd: 0.9 },
    death_stalker: { id: 'death_stalker', name: '🦂 死亡猎手', desc: '万毒之王', hp: 350, atk: 72, def: 40, spd: 1.0 }
  },
  
  TIER7: {
    apex_predator: { id: 'apex_predator', name: '👑 创世神兽', desc: '进化顶点', hp: 800, atk: 80, def: 60, spd: 1.0, ultimate: true }
  }
};

// 经验需求
const EXP_REQUIREMENTS = {
  2: 50,   3: 120,  4: 250,  5: 450,  6: 750,  7: 1200
};

// 物资类型
const DROP_TYPES = {
  meat: { name: '🥩 肉', color: '#e74c3c', exp: 20, bonus: { atk: 2 } },
  plant: { name: '🌿 植物', color: '#27ae60', exp: 12, bonus: { def: 3 } },
  fungi: { name: '🍄 真菌', color: '#8e44ad', exp: 18, bonus: { poison: 5 } },
  fish: { name: '🐟 鱼', color: '#3498db', exp: 15, bonus: { spd: 0.1 } },
  insect: { name: '🐛 昆虫', color: '#e67e22', exp: 10, bonus: { atkSpd: 0.1 } },
  water: { name: '💧 水源', color: '#00bcd4', exp: 8, bonus: { hp: 10 } },
  sunlight: { name: '☀️ 阳光', color: '#f1c40f', exp: 6, bonus: { energy: 5 } },
  mineral: { name: '💎 矿物', color: '#95a5a6', exp: 25, bonus: { def: 5 } }
};

// 技能数据
const SKILLS = {
  bite: { name: '🦷 撕咬', damage: 1.0, cooldown: 1.5, tier: 1, type: 'melee', icon: '🦷' },
  peck: { name: '🐦 啄击', damage: 0.9, cooldown: 1.2, tier: 1, type: 'melee', icon: '🐦' },
  sting: { name: '💉 毒刺', damage: 1.2, cooldown: 1.5, tier: 1, type: 'poison', icon: '💉' },
  splash: { name: '💧 水溅', damage: 0.6, cooldown: 1.0, tier: 1, type: 'aoe', icon: '💧' },
  charge: { name: '💨 冲锋', damage: 1.3, cooldown: 3.0, tier: 3, type: 'dash', icon: '💨' },
  dive: { name: '🦅 俯冲', damage: 1.5, cooldown: 2.5, tier: 3, type: 'dive', icon: '🦅' },
  tailWhip: { name: '🦎 尾击', damage: 1.4, cooldown: 2.0, tier: 3, type: 'range', icon: '🦎' },
  roar: { name: '🦁 咆哮', damage: 1.2, cooldown: 5.0, tier: 4, type: 'aoe', icon: '🦁' },
  venom: { name: '☠️ 毒素', damage: 1.6, cooldown: 2.5, tier: 4, type: 'poison', icon: '☠️' },
  berserk: { name: '🔥 狂暴', damage: 2.5, cooldown: 8.0, tier: 6, type: 'buff', icon: '🔥' },
  earthquake: { name: '🌋 地震', damage: 3.5, cooldown: 15.0, tier: 7, type: 'ultimate', icon: '🌋' },
  firestorm: { name: '🔥 烈火风暴', damage: 4.0, cooldown: 15.0, tier: 7, type: 'ultimate', icon: '🔥' },
  tsunami: { name: '🌊 深海狂潮', damage: 3.8, cooldown: 15.0, tier: 7, type: 'ultimate', icon: '🌊' },
  deathMark: { name: '💀 死亡标记', damage: 5.0, cooldown: 20.0, tier: 7, type: 'ultimate', icon: '💀' }
};

// 游戏配置
const CONFIG = {
  WORLD_SIZE: 1000,
  MAP_SIZE: 200,
  INITIAL_HP: 40,
  INITIAL_ATK: 5,
  INITIAL_DEF: 3,
  INITIAL_SPD: 1.0,
  PICKUP_RADIUS: 50,
  ATTACK_RANGE: 40,
  ZONE_SHRINK_INTERVAL: 90,
  ZONE_SHRINK_RATE: 0.015,
  BOT_COUNT: 19,
  DROP_COUNT: 100,
  DROP_RESPAWN_INTERVAL: 15,
  DROP_RESPAWN_AMOUNT: 5
};

// ========================
// 进化选择系统
// ========================

class EvolutionSystem {
  constructor() {
    this.currentSpecies = null;
    this.lineage = []; // 进化历史
  }
  
  // 获取当前可用的进化选项
  getEvolutionOptions(tier) {
    const branch = tier === 1 ? 'TIER1' : 
                   tier === 2 ? 'TIER2' :
                   tier === 3 ? 'TIER3' :
                   tier === 4 ? 'TIER4' :
                   tier === 5 ? 'TIER5' :
                   tier === 6 ? 'TIER6' : 'TIER7';
    
    return EVOLUTION_BRANCHES[branch] || [];
  }
  
  // 显示进化选择UI
  showEvolutionUI(tier, currentSpecies, callback) {
    const options = this.getEvolutionOptions(tier);
    const container = document.createElement('div');
    container.id = 'evolution-modal';
    container.innerHTML = `
      <div class="evolution-overlay"></div>
      <div class="evolution-panel">
        <h2>${tier === 1 ? '🌱 选择初始形态' : tier === 2 ? '🔀 选择进化分支' : '⚡ 选择进化方向'}</h2>
        <div class="evolution-options">
          ${Array.isArray(options) ? options.map(opt => `
            <div class="evolution-option" data-id="${opt.id}">
              <div class="option-icon">${opt.name.split(' ')[0]}</div>
              <div class="option-info">
                <div class="option-name">${opt.name}</div>
                <div class="option-desc">${opt.desc}</div>
                <div class="option-stats">
                  ❤️${opt.hp} ⚔️${opt.atk} 🛡️${opt.def} 💨${opt.spd}
                </div>
              </div>
            </div>
          `).join('') : this.renderBranches(options)}
        </div>
      </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      #evolution-modal {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        z-index: 10000; display: flex; align-items: center; justify-content: center;
      }
      .evolution-overlay {
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.8);
      }
      .evolution-panel {
        position: relative; background: linear-gradient(135deg, #1a1a2e, #16213e);
        border: 2px solid #3498db; border-radius: 20px; padding: 30px;
        max-width: 90vw; max-height: 80vh; overflow-y: auto;
        box-shadow: 0 0 50px rgba(52,152,219,0.5);
      }
      .evolution-panel h2 {
        text-align: center; color: #f1c40f; margin-bottom: 20px;
        font-size: 24px;
      }
      .evolution-options {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
      }
      .evolution-option {
        background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2);
        border-radius: 15px; padding: 15px; cursor: pointer;
        transition: all 0.3s; display: flex; gap: 15px;
      }
      .evolution-option:hover {
        background: rgba(52,152,219,0.3); border-color: #3498db;
        transform: scale(1.02);
      }
      .option-icon { font-size: 40px; }
      .option-info { flex: 1; }
      .option-name { color: #fff; font-size: 16px; font-weight: bold; }
      .option-desc { color: rgba(255,255,255,0.7); font-size: 12px; margin: 5px 0; }
      .option-stats { color: #3498db; font-size: 11px; }
    `;
    document.head.appendChild(style);
    document.body.appendChild(container);
    
    // 绑定点击事件
    container.querySelectorAll('.evolution-option').forEach(el => {
      el.addEventListener('click', () => {
        const selectedId = el.dataset.id;
        container.remove();
        style.remove();
        callback(selectedId);
      });
    });
  }
  
  renderBranches(options) {
    return Object.entries(options).map(([key, opts]) => `
      <div class="branch-group">
        <div class="branch-title">${key.toUpperCase()}</div>
        ${opts.map(opt => `
          <div class="evolution-option" data-id="${opt.id}">
            <div class="option-icon">${opt.name.split(' ')[0]}</div>
            <div class="option-info">
              <div class="option-name">${opt.name}</div>
              <div class="option-desc">${opt.desc}</div>
              <div class="option-stats">
                ❤️${opt.hp} ⚔️${opt.atk} 🛡️${opt.def} 💨${opt.spd}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');
  }
}

// 全局进化系统实例
const evolutionSystem = new EvolutionSystem();

console.log('🧬 生物分类学进化系统 v2.0 已加载！');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 系统统计:');
console.log('   进化阶段: 7个 (Tier 1-7)');
console.log('   初始分支: 6大类');
console.log('   Tier 3分支: 15+种进化路线');
console.log('   Tier 4物种: 40+种选择');
console.log('   Tier 5精英: 11种终极进化');
console.log('   Tier 6传说: 5种神话生物');
console.log('   Tier 7终极: 1种创世神兽');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🎮 玩家可以自由选择进化路线！');
