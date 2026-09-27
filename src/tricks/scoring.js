

class Scoring {
  constructor() { this.combo = 0; this.baseScore = 100; }
  scoreTrick(rotation, airTime) {
    // BUG: 四舍五入到最近整数倍
    const spins = Math.round(rotation.getTotalRotation() / 360);
    return spins * this.baseScore;
  }
  land(rotation) {
    // BUG: 不验证是否为180整数倍
    return {success: true, score: this.scoreTrick(rotation, 1)};
  }
}

module.exports = { Scoring };
