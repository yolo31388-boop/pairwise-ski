
const { Rotation } = require('../src/tricks/rotation.js');
const { Scoring } = require('../src/tricks/scoring.js');
const { Skier } = require('../src/player/skier.js');

describe('滑雪特技判定', () => {
  test('累计旋转角度', () => {
    const r = new Rotation();
    r.angularVelocity = 360;
    r.update(0.5);
    r.update(0.5);
    expect(r.getTotalRotation()).toBeCloseTo(360, 0);
  });
  test('角速度积分', () => {
    const r = new Rotation();
    r.angularVelocity = 180;
    r.update(2);
    expect(r.getTotalRotation()).toBeCloseTo(360, 0);
  });
  test('落地瞬间判定', () => {
    const skier = new Skier();
    skier.jump();
    skier.rotation.angularVelocity = 360;
    skier.rotation.update(1);
    const result = skier.land();
    expect(result.success).toBe(true);
  });
  test('基于整数倍计分', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 720;
    expect(s.scoreTrick(r, 1)).toBe(200);
  });
  test('抓板叠加计分', () => {
    const s = new Scoring();
    expect(s.scoreWithGrab(100, 'mute')).toBeGreaterThan(100);
  });
  test('非整数倍摔倒', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 270;
    const result = s.land(r);
    expect(result.success).toBe(false);
  });
  test('空中时间基础分', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 360;
    expect(s.scoreTrick(r, 3)).toBeGreaterThan(s.scoreTrick(r, 1));
  });
  test('连击加成', () => {
    const s = new Scoring();
    s.combo = 2;
    const r = new Rotation();
    r.totalAngle = 360;
    expect(s.scoreTrick(r, 1)).toBeGreaterThan(100);
  });
  test('摔倒重置连击', () => {
    const skier = new Skier();
    skier.scoring.combo = 3;
    skier.jump();
    skier.rotation.totalAngle = 90;
    skier.land();
    expect(skier.scoring.combo).toBe(0);
  });
  test('不同地形规则', () => {
    const s = new Scoring();
    expect(s.getTerrainMultiplier('halfpipe')).toBeGreaterThan(1);
  });
  test('旋转方向区分', () => {
    const r1 = new Rotation();
    r1.totalAngle = 360;
    const r2 = new Rotation();
    r2.totalAngle = -360;
    expect(r1.getTotalRotation()).not.toBe(r2.getTotalRotation());
  });
  test('连续旋转不重置', () => {
    const r = new Rotation();
    r.angularVelocity = 360;
    r.update(0.5);
    r.update(0.5);
    r.update(0.5);
    expect(r.getTotalRotation()).toBeCloseTo(540, 0);
  });
});
