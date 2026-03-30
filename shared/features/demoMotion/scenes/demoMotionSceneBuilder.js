import { DEFAULT_DEMO_MOTION_PROPS } from "../config/demoMotionDefaults.js";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const mapRange = (value, inMin, inMax, outMin, outMax) => {
  if (inMax === inMin) {
    return outMin;
  }
  const ratio = (value - inMin) / (inMax - inMin);
  return outMin + ratio * (outMax - outMin);
};

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
};

const toInt = (value, fallback, min, max) =>
  Math.round(clamp(toNumber(value, fallback), min, max));

const toPositiveFrames = (value, fallback) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(1, Math.round(parsed));
};

export const resolveDemoMotionSceneContext = (pluginParams = {}) => {
  const videoWidth = toInt(pluginParams.videoWidth, DEFAULT_DEMO_MOTION_PROPS.videoWidth, 256, 3840);
  const videoHeight = toInt(
    pluginParams.videoHeight,
    DEFAULT_DEMO_MOTION_PROPS.videoHeight,
    256,
    3840
  );

  return {
    kelvin: toInt(pluginParams.kelvin, DEFAULT_DEMO_MOTION_PROPS.kelvin, 2600, 6600),
    minKelvin: DEFAULT_DEMO_MOTION_PROPS.minKelvin,
    maxKelvin: DEFAULT_DEMO_MOTION_PROPS.maxKelvin,
    baseKelvin: DEFAULT_DEMO_MOTION_PROPS.baseKelvin,
    majorTickValues: DEFAULT_DEMO_MOTION_PROPS.majorTickValues,
    durationSeconds: clamp(
      toNumber(pluginParams.durationSeconds, DEFAULT_DEMO_MOTION_PROPS.durationSeconds),
      1,
      30
    ),
    layout: {
      videoWidth,
      videoHeight,
    },
  };
};

export const getDemoMotionDurationInFrames = ({ fps, sceneContext, pluginParams } = {}) => {
  const resolvedContext = sceneContext ?? resolveDemoMotionSceneContext(pluginParams ?? {});
  const resolvedFps = toPositiveFrames(fps, 30);
  return toPositiveFrames(resolvedContext.durationSeconds * resolvedFps, resolvedFps);
};

export const buildDemoMotionSceneProps = ({
  fps,
  sceneContext,
  pluginParams,
} = {}) => {
  const resolvedContext = sceneContext ?? resolveDemoMotionSceneContext(pluginParams ?? {});
  const safeKelvin = clamp(
    toInt(resolvedContext.kelvin, DEFAULT_DEMO_MOTION_PROPS.kelvin, 2600, 6600),
    resolvedContext.minKelvin,
    resolvedContext.maxKelvin
  );
  const handleLeftPercent = mapRange(
    safeKelvin,
    resolvedContext.minKelvin,
    resolvedContext.maxKelvin,
    0,
    100
  );
  const warmOverlayOpacity =
    safeKelvin < resolvedContext.baseKelvin
      ? clamp(
          mapRange(
            safeKelvin,
            resolvedContext.baseKelvin,
            resolvedContext.minKelvin,
            0,
            0.8
          ),
          0,
          0.8
        )
      : 0;
  const coldOverlayOpacity =
    safeKelvin > resolvedContext.baseKelvin
      ? clamp(
          mapRange(
            safeKelvin,
            resolvedContext.baseKelvin,
            resolvedContext.maxKelvin,
            0,
            0.8
          ),
          0,
          0.8
        )
      : 0;

  return {
    ...resolvedContext,
    durationInFrames: getDemoMotionDurationInFrames({
      fps,
      sceneContext: resolvedContext,
    }),
    frame: 0,
    progress: 0,
    kelvin: safeKelvin,
    handleLeftPercent,
    warmOverlayOpacity,
    coldOverlayOpacity,
  };
};
