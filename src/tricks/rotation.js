
class Rotation {
  constructor() { this.totalAngle = 0; this.angularVelocity = 0; this.initialFacing = 0; }
  update(dt) {
    // BUG: 只看最终朝向
    this.totalAngle = this.angularVelocity * dt;
  }
  getTotalRotation() {
    // BUG: 用最终朝向减初始朝向
    return this.totalAngle;
  }
}

module.exports = { Rotation };
