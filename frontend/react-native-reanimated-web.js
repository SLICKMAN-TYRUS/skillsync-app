// Minimal shim for react-native-reanimated on web to avoid bundle errors in dev preview.
// This provides a tiny subset of the API used by libraries that optionally import reanimated.
const Reanimated = {
  // helpers often used: createAnimatedComponent, Value, useAnimatedStyle, withTiming
  createAnimatedComponent: (C) => C,
  Value: function Value(v) { this.value = v; },
  useAnimatedStyle: () => ({}),
  withTiming: (v) => v,
  add: (...args) => args.reduce((a,b) => a + b, 0),
  multiply: (a,b) => a * b,
};

module.exports = Reanimated;
