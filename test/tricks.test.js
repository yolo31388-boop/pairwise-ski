
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

describe('引擎边界不变量', () => {
  test('540度不得被四舍五入成360或720的分数', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 540;
    expect(s.scoreTrick(r, 1)).toBeCloseTo(150, 10);
  });

  test('反向旋转角度为负且与正向不同，落地同样有效', () => {
    const r = new Rotation();
    r.angularVelocity = -360;
    r.update(1);
    expect(r.getTotalRotation()).toBeCloseTo(-360, 10);
    expect(r.getDirection()).toBe('ccw');
    const s = new Scoring();
    const result = s.land(r);
    expect(result.success).toBe(true);
    expect(result.direction).toBe('ccw');
    expect(result.angle).toBeLessThan(0);
  });

  test('完整一周结束于同朝向，但累计角度不得归零（旧bug回归）', () => {
    const r = new Rotation();
    r.angularVelocity = 360;
    r.update(0.5);
    r.update(0.5);
    expect(r.getTotalRotation()).toBeCloseTo(360, 10);
    const r2 = new Rotation();
    r2.angularVelocity = 360;
    r2.update(2);
    expect(r2.getTotalRotation()).toBeCloseTo(720, 10);
  });

  test('450度是非整数倍，必须摔倒', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 450;
    const result = s.land(r);
    expect(result.success).toBe(false);
    expect(result.crashed).toBe(true);
  });

  test('180度在跳台合法', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 180;
    expect(s.land(r).success).toBe(true);
  });

  test('抓板加分叠加在旋转分之上且受地形倍率影响', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 360;
    expect(s.scoreTrick(r, 1)).toBeCloseTo(100, 10);
    expect(s.scoreTrick(r, 1, { grab: 'mute', terrain: 'jump' })).toBeCloseTo(200, 10);
    expect(s.scoreTrick(r, 1, { grab: 'mute', terrain: 'rail' })).toBeCloseTo(180, 10);
    expect(s.scoreTrick(r, 1, { grab: 'mute', terrain: 'halfpipe' })).toBeCloseTo(375, 10);
  });

  test('空中时间单调影响基础分', () => {
    const s = new Scoring();
    const r = new Rotation();
    r.totalAngle = 360;
    const a = s.scoreTrick(r, 1);
    const b = s.scoreTrick(r, 3);
    const c = s.scoreTrick(r, 5);
    expect(a).toBeCloseTo(100, 10);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });

  test('成功落地后连击数加一，且下一次特技享受连击加成', () => {
    const s = new Scoring();
    const r = () => { const rot = new Rotation(); rot.totalAngle = 360; return rot; };
    expect(s.combo).toBe(0);
    const first = s.land(r(), { airTime: 1 });
    expect(first.success).toBe(true);
    expect(s.combo).toBe(1);
    expect(s.scoreTrick(r(), 1)).toBeCloseTo(150, 10);
    expect(s.land(r(), { airTime: 1 }).combo).toBe(2);
  });

  test('摔倒重置连击并扣除当前特技分数（负分）', () => {
    const s = new Scoring();
    const good = new Rotation();
    good.totalAngle = 360;
    s.land(good, { airTime: 2, terrain: 'halfpipe' });
    expect(s.combo).toBe(1);
    const bad = new Rotation();
    bad.totalAngle = 90;
    const result = s.land(bad, { airTime: 2, terrain: 'halfpipe' });
    expect(result.success).toBe(false);
    expect(result.score).toBeLessThan(0);
    expect(s.combo).toBe(0);
  });

  test('地形倍率区分跳台、铁杆、半管', () => {
    const s = new Scoring();
    expect(s.getTerrainMultiplier('jump')).toBe(1.0);
    expect(s.getTerrainMultiplier('rail')).toBeGreaterThan(s.getTerrainMultiplier('jump'));
    expect(s.getTerrainMultiplier('halfpipe')).toBeGreaterThan(s.getTerrainMultiplier('rail'));
    const r = new Rotation();
    r.totalAngle = 360;
    expect(s.scoreTrick(r, 1, { terrain: 'halfpipe' })).toBeCloseTo(150, 10);
  });

  test('update触雪瞬间判定：接触帧被截断，角度恰为360', () => {
    const skier = new Skier('jump');
    skier.jump();
    skier.rotation.angularVelocity = 180;
    skier.update(1.9);
    expect(skier.airborne).toBe(true);
    skier.update(0.5);
    expect(skier.airborne).toBe(false);
    expect(skier.lastResult.success).toBe(true);
    expect(skier.lastResult.angle).toBeCloseTo(360, 6);
    expect(skier.airTime).toBeCloseTo(2, 6);
  });

  test('update不会延迟到越过接触点（整帧超过落地时刻）', () => {
    const skier = new Skier('jump');
    skier.jump();
    skier.rotation.angularVelocity = 540;
    skier.update(2);
    expect(skier.airborne).toBe(false);
    expect(skier.lastResult.angle).toBeCloseTo(1080, 6);
    expect(skier.lastResult.success).toBe(true);
  });

  test('接触瞬间角度为270时自动落地判摔倒', () => {
    const skier = new Skier('jump');
    skier.jump();
    skier.rotation.angularVelocity = 135;
    skier.update(2);
    expect(skier.lastResult.angle).toBeCloseTo(270, 6);
    expect(skier.lastResult.success).toBe(false);
    expect(skier.scoring.combo).toBe(0);
  });

  test('半管起跳滞空更长，长滞空得分更高', () => {
    const pipe = new Skier('halfpipe');
    pipe.jump();
    pipe.rotation.angularVelocity = 300;
    pipe.update(2.4);
    expect(pipe.lastResult.success).toBe(true);
    expect(pipe.lastResult.angle).toBeCloseTo(720, 6);
    expect(pipe.lastResult.score).toBeGreaterThan(200);
  });

  test('角速度变化时积分逐帧累计，连续旋转不重置', () => {
    const r = new Rotation();
    r.angularVelocity = 360;
    r.update(0.5);
    r.angularVelocity = 720;
    r.update(0.5);
    r.angularVelocity = 360;
    r.update(0.5);
    expect(r.getTotalRotation()).toBeCloseTo(720, 10);
  });

  test('起跳重置上一轮累计角度与抓板', () => {
    const skier = new Skier('jump');
    skier.jump();
    skier.rotation.angularVelocity = 360;
    skier.grab('indy');
    skier.rotation.update(1);
    skier.land();
    skier.jump();
    expect(skier.rotation.getTotalRotation()).toBe(0);
    expect(skier.grabType).toBeNull();
    expect(skier.airTime).toBe(0);
  });

  test('连续成功特技连击递增，摔倒后归零再重新累计', () => {
    const skier = new Skier('jump');
    skier.jump();
    skier.rotation.totalAngle = 360;
    expect(skier.land().combo).toBe(1);
    skier.jump();
    skier.rotation.totalAngle = 360;
    expect(skier.land().combo).toBe(2);
    skier.jump();
    skier.rotation.totalAngle = 90;
    expect(skier.land().success).toBe(false);
    expect(skier.scoring.combo).toBe(0);
    skier.jump();
    skier.rotation.totalAngle = 180;
    expect(skier.land().combo).toBe(1);
  });

  test('落地后再次调用land保持幂等，不重复计分', () => {
    const skier = new Skier('jump');
    skier.jump();
    skier.rotation.totalAngle = 360;
    const first = skier.land();
    const again = skier.land();
    expect(again).toBe(first);
    expect(skier.scoring.combo).toBe(1);
  });
});
