const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
};

const toInt = (value, fallback, min, max) =>
  Math.round(clamp(toNumber(value, fallback), min, max));

export const DEFAULT_DEMO_MOTION_PROPS = Object.freeze({
  videoWidth: 1080,
  videoHeight: 1080,
  durationSeconds: 6,
  kelvin: 4900,
  minKelvin: 2600,
  baseKelvin: 4900,
  maxKelvin: 6600,
  majorTickValues: Object.freeze([2700, 4900, 6500]),
});

export const DEMO_MOTION_PARAM_FIELDS = Object.freeze([
  {
    key: "kelvin",
    label: "kelvin",
    control: "number",
    min: 2600,
    max: 6600,
    step: 100,
    section: "primary",
  },
  {
    key: "videoWidth",
    label: "videoWidth",
    control: "number",
    min: 256,
    max: 3840,
    step: 1,
  },
  {
    key: "videoHeight",
    label: "videoHeight",
    control: "number",
    min: 256,
    max: 3840,
    step: 1,
  },
  {
    key: "durationSeconds",
    label: "durationSeconds",
    control: "number",
    min: 1,
    max: 30,
    step: 0.5,
  },
]);

export const normalizeDemoMotionParamValue = ({ key, rawValue, currentValue } = {}) => {
  switch (key) {
    case "kelvin":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PROPS.kelvin, 2600, 6600);
    case "videoWidth":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PROPS.videoWidth, 256, 3840);
    case "videoHeight":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PROPS.videoHeight, 256, 3840);
    case "durationSeconds":
      return clamp(toNumber(rawValue, DEFAULT_DEMO_MOTION_PROPS.durationSeconds), 1, 30);
    default:
      return currentValue ?? rawValue;
  }
};
