class Rotation {
  constructor() {
    this.totalAngle = 0;
    this.angularVelocity = 0;
    this.facing = 0;
  }

  update(dt) {
    this.totalAngle += this.angularVelocity * dt;
    this.facing += this.angularVelocity * dt;
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
