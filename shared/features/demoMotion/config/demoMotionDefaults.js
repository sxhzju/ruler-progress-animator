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

const toEaseType = (value, fallback) => {
  if (value === "linear" || value === "easeOut" || value === "easeInOut") {
    return value;
  }
  return fallback;
};

export const DEFAULT_DEMO_MOTION_PROPS = Object.freeze({
  videoWidth: 1080,
  videoHeight: 1080,
  minPercent: 0,
  maxPercent: 100,
  phaseOneTargetPercent: 70,
  phaseOneDurationSeconds: 3.75,
  pauseSeconds: 0.45,
  phaseTwoDurationSeconds: 1.8,
  phaseOneEasePower: 3,
  phaseTwoEaseType: "easeOut",
  phaseTwoEasePower: 1.5,
  majorTickValues: Object.freeze([0, 50, 100]),
});

export const DEMO_MOTION_PARAM_FIELDS = Object.freeze([
  {
    key: "phaseOneTargetPercent",
    label: "phaseOneTargetPercent",
    control: "number",
    min: 0,
    max: 100,
    step: 1,
    section: "primary",
  },
  {
    key: "phaseOneDurationSeconds",
    label: "phaseOneDurationSeconds",
    control: "number",
    min: 0.05,
    max: 30,
    step: 0.05,
    section: "primary",
  },
  {
    key: "pauseSeconds",
    label: "pauseSeconds",
    control: "number",
    min: 0,
    max: 10,
    step: 0.05,
    section: "primary",
  },
  {
    key: "phaseTwoDurationSeconds",
    label: "phaseTwoDurationSeconds",
    control: "number",
    min: 0.05,
    max: 30,
    step: 0.05,
    section: "primary",
  },
  {
    key: "phaseOneEasePower",
    label: "phaseOneEasePower",
    control: "number",
    min: 1,
    max: 6,
    step: 0.1,
  },
  {
    key: "phaseTwoEasePower",
    label: "phaseTwoEasePower",
    control: "number",
    min: 1,
    max: 6,
    step: 0.1,
  },
  {
    key: "phaseTwoEaseType",
    label: "phaseTwoEaseType",
    control: "select",
    options: Object.freeze(["linear", "easeOut", "easeInOut"]),
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
]);

export const normalizeDemoMotionParamValue = ({ key, rawValue, currentValue } = {}) => {
  switch (key) {
    case "phaseOneTargetPercent":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PROPS.phaseOneTargetPercent, 0, 100);
    case "phaseOneDurationSeconds":
      return clamp(toNumber(rawValue, DEFAULT_DEMO_MOTION_PROPS.phaseOneDurationSeconds), 0.05, 30);
    case "pauseSeconds":
      return clamp(toNumber(rawValue, DEFAULT_DEMO_MOTION_PROPS.pauseSeconds), 0, 10);
    case "phaseTwoDurationSeconds":
      return clamp(toNumber(rawValue, DEFAULT_DEMO_MOTION_PROPS.phaseTwoDurationSeconds), 0.05, 30);
    case "phaseOneEasePower":
      return clamp(toNumber(rawValue, DEFAULT_DEMO_MOTION_PROPS.phaseOneEasePower), 1, 6);
    case "phaseTwoEasePower":
      return clamp(toNumber(rawValue, DEFAULT_DEMO_MOTION_PROPS.phaseTwoEasePower), 1, 6);
    case "phaseTwoEaseType":
      return toEaseType(rawValue, DEFAULT_DEMO_MOTION_PROPS.phaseTwoEaseType);
    case "videoWidth":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PROPS.videoWidth, 256, 3840);
    case "videoHeight":
      return toInt(rawValue, DEFAULT_DEMO_MOTION_PROPS.videoHeight, 256, 3840);
    default:
      return currentValue ?? rawValue;
  }
};
