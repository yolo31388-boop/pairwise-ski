
const ANGLE_EPSILON = 1e-6;

// 每种地形有独立的判定规则、分数倍率、空中时间加成系数与抓板加分。
// jump   : 跳台，基准规则，任意 180 整数倍即可稳定落地
// rail   : 铁杆，倍率更高但抓板加分少（铁杆上抓板空间有限）
// halfpipe : 半管，倍率最高，长滞空收益最大
const TERRAINS = {
  jump:     { multiplier: 1.0, airFactorPerSec: 0.25, grabBonus: 100 },
  rail:     { multiplier: 1.2, airFactorPerSec: 0.10, grabBonus: 50 },
  halfpipe: { multiplier: 1.5, airFactorPerSec: 0.40, grabBonus: 150 },
};

class Scoring {
  constructor() {
    this.combo = 0;
    this.baseScore = 100;
  }

  getTerrainRules(terrain) {
    return TERRAINS[terrain] || TERRAINS.jump;
  }

  getTerrainMultiplier(terrain) {
    return this.getTerrainRules(terrain).multiplier;
  }

  // 落地角度必须是 180 的整数倍（顺时针/逆时针均可），否则必然摔倒。
  // 禁止四舍五入到最近的整数倍来“修正”姿态。
  isCompleteRotation(angle) {
    return Math.abs(angle / 180 - Math.round(angle / 180)) <= ANGLE_EPSILON;
  }

  getGrabBonus(grab, terrain = 'jump') {
    if (!grab) return 0;
    return this.getTerrainRules(terrain).grabBonus;
  }

  // 抓板分在地形倍率之前与旋转基础分叠加，不会覆盖旋转分。
  scoreWithGrab(base, grab, terrain = 'jump') {
    return base + this.getGrabBonus(grab, terrain);
  }

  scoreTrick(rotation, airTime = 1, options = {}) {
    const { grab = null, terrain = 'jump', combo = this.combo } = options;
    const rules = this.getTerrainRules(terrain);

    // 基础分直接来自累计旋转角度：每 180 度 50 分（360 = 100）。
    // 正反方向旋转分数一致，但方向信息单独保留，不做四舍五入。
    const halfTurns = Math.abs(rotation.getTotalRotation()) / 180;
    let score = halfTurns * (this.baseScore / 2);

    // 抓板与旋转叠加计分。
    score += this.getGrabBonus(grab, terrain);

    // 空中时间越长，基础分越高（至少 1 秒基准）。
    const airFactor = 1 + rules.airFactorPerSec * Math.max(0, airTime - 1);

    // 当前连击数提供连击加成（成功落地后 combo 才 +1）。
    const comboFactor = 1 + 0.5 * combo;

    return score * airFactor * comboFactor * rules.multiplier;
  }

  land(rotation, options = {}) {
    const { airTime = 1, grab = null, terrain = 'jump' } = options;
    const angle = rotation.getTotalRotation();

    if (!this.isCompleteRotation(angle)) {
      // 摔倒：连击清零，并扣除本次特技本应得到的分数（负分）。
      const score = -this.scoreTrick(rotation, airTime, { grab, terrain });
      this.combo = 0;
      return {
        success: false,
        crashed: true,
        score,
        combo: this.combo,
        angle,
        direction: rotation.getDirection(),
        terrain,
      };
    }

    const score = this.scoreTrick(rotation, airTime, { grab, terrain });
    this.combo += 1;
    return {
      success: true,
      crashed: false,
      score,
      combo: this.combo,
      angle,
      direction: rotation.getDirection(),
      terrain,
    };
  }
}

module.exports = { Scoring };
