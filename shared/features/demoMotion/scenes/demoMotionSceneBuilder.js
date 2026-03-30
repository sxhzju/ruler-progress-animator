import { DEFAULT_DEMO_MOTION_PROPS } from "../config/demoMotionDefaults.js";

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
    cursorPercent: toInt(pluginParams.cursorPercent, DEFAULT_DEMO_MOTION_PROPS.cursorPercent, 0, 100),
    minPercent: DEFAULT_DEMO_MOTION_PROPS.minPercent,
    maxPercent: DEFAULT_DEMO_MOTION_PROPS.maxPercent,
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
  frame,
  fps,
  sceneContext,
  pluginParams,
} = {}) => {
  const resolvedContext = sceneContext ?? resolveDemoMotionSceneContext(pluginParams ?? {});
  const safeCursorPercent = clamp(
    toNumber(resolvedContext.cursorPercent, DEFAULT_DEMO_MOTION_PROPS.cursorPercent),
    resolvedContext.minPercent,
    resolvedContext.maxPercent
  );

  const durationInFrames = getDemoMotionDurationInFrames({
    fps,
    sceneContext: resolvedContext,
  });
  const safeFrame = clamp(Math.round(Number(frame) || 0), 0, Math.max(0, durationInFrames - 1));
  const progress =
    durationInFrames <= 1 ? 0 : safeFrame / Math.max(1, durationInFrames - 1);

  return {
    ...resolvedContext,
    durationInFrames,
    frame: safeFrame,
    progress,
    cursorPercent: safeCursorPercent,
    handleLeftPercent: safeCursorPercent,
  };
};
