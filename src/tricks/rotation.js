class Rotation {
  constructor() {
    this.totalAngle = 0;
    this.angularVelocity = 0;
  }

  reset() {
    this.totalAngle = 0;
    this.angularVelocity = 0;
  }

  update(dt) {
    // 对角速度做时间积分，累计本次起跳以来的总旋转角度。
    // angularVelocity > 0 为顺时针，< 0 为逆时针，符号必须保留，
    // 不能用最终朝向减去初始朝向（那样 360 会被归零）。
    this.totalAngle += this.angularVelocity * dt;
  }

  getTotalRotation() {
    return this.totalAngle;
  }

  getDirection() {
    if (this.totalAngle > 0) return 'cw';
    if (this.totalAngle < 0) return 'ccw';
    return 'none';
  }
}

module.exports = { Rotation };
