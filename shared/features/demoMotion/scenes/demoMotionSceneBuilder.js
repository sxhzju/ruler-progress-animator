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

const toProgress01 = (frame, frameCount) => {
  if (frameCount <= 1) {
    return 1;
  }
  return clamp(frame / (frameCount - 1), 0, 1);
};

const easeOutPow = (t, power) => 1 - (1 - clamp(t, 0, 1)) ** power;
const easeInOutPow = (t, power) => {
  const x = clamp(t, 0, 1);
  if (x < 0.5) {
    return ((2 * x) ** power) / 2;
  }
  return 1 - ((2 * (1 - x)) ** power) / 2;
};

const normalizeEaseType = (value, fallback) => {
  if (value === "linear" || value === "easeOut" || value === "easeInOut") {
    return value;
  }
  return fallback;
};

const resolvePhaseTimingFrames = ({ fps, sceneContext }) => {
  const resolvedFps = toPositiveFrames(fps, 30);
  const phaseOneFrames = toPositiveFrames(
    sceneContext.phaseOneDurationSeconds * resolvedFps,
    resolvedFps
  );
  const pauseFrames = Math.max(0, Math.round(sceneContext.pauseSeconds * resolvedFps));
  const phaseTwoFrames = toPositiveFrames(
    sceneContext.phaseTwoDurationSeconds * resolvedFps,
    resolvedFps
  );
  const durationInFrames = Math.max(1, phaseOneFrames + pauseFrames + phaseTwoFrames);

  return {
    resolvedFps,
    phaseOneFrames,
    pauseFrames,
    phaseTwoFrames,
    durationInFrames,
  };
};

export const resolveDemoMotionSceneContext = (pluginParams = {}) => {
  const videoWidth = toInt(pluginParams.videoWidth, DEFAULT_DEMO_MOTION_PROPS.videoWidth, 256, 3840);
  const videoHeight = toInt(
    pluginParams.videoHeight,
    DEFAULT_DEMO_MOTION_PROPS.videoHeight,
    256,
    3840
  );
  const phaseOneDurationSeconds = clamp(
    toNumber(
      pluginParams.phaseOneDurationSeconds,
      DEFAULT_DEMO_MOTION_PROPS.phaseOneDurationSeconds
    ),
    0.05,
    30
  );
  const pauseSeconds = clamp(
    toNumber(pluginParams.pauseSeconds, DEFAULT_DEMO_MOTION_PROPS.pauseSeconds),
    0,
    10
  );
  const phaseTwoDurationSeconds = clamp(
    toNumber(
      pluginParams.phaseTwoDurationSeconds,
      DEFAULT_DEMO_MOTION_PROPS.phaseTwoDurationSeconds
    ),
    0.05,
    30
  );

  return {
    minPercent: DEFAULT_DEMO_MOTION_PROPS.minPercent,
    maxPercent: DEFAULT_DEMO_MOTION_PROPS.maxPercent,
    phaseOneTargetPercent: clamp(
      toNumber(
        pluginParams.phaseOneTargetPercent,
        DEFAULT_DEMO_MOTION_PROPS.phaseOneTargetPercent
      ),
      DEFAULT_DEMO_MOTION_PROPS.minPercent,
      DEFAULT_DEMO_MOTION_PROPS.maxPercent
    ),
    phaseOneDurationSeconds,
    pauseSeconds,
    phaseTwoDurationSeconds,
    phaseOneEasePower: clamp(
      toNumber(pluginParams.phaseOneEasePower, DEFAULT_DEMO_MOTION_PROPS.phaseOneEasePower),
      1,
      6
    ),
    phaseTwoEasePower: clamp(
      toNumber(pluginParams.phaseTwoEasePower, DEFAULT_DEMO_MOTION_PROPS.phaseTwoEasePower),
      1,
      6
    ),
    phaseTwoEaseType: normalizeEaseType(
      pluginParams.phaseTwoEaseType,
      DEFAULT_DEMO_MOTION_PROPS.phaseTwoEaseType
    ),
    majorTickValues: DEFAULT_DEMO_MOTION_PROPS.majorTickValues,
    durationSeconds: phaseOneDurationSeconds + pauseSeconds + phaseTwoDurationSeconds,
    layout: {
      videoWidth,
      videoHeight,
    },
  };
};

export const getDemoMotionDurationInFrames = ({ fps, sceneContext, pluginParams } = {}) => {
  const resolvedContext = sceneContext ?? resolveDemoMotionSceneContext(pluginParams ?? {});
  return resolvePhaseTimingFrames({
    fps,
    sceneContext: resolvedContext,
  }).durationInFrames;
};

export const buildDemoMotionSceneProps = ({
  frame,
  fps,
  sceneContext,
  pluginParams,
} = {}) => {
  const resolvedContext = sceneContext ?? resolveDemoMotionSceneContext(pluginParams ?? {});
  const durationInFrames = getDemoMotionDurationInFrames({
    fps,
    sceneContext: resolvedContext,
  });
  const { phaseOneFrames, pauseFrames, phaseTwoFrames } = resolvePhaseTimingFrames({
    fps,
    sceneContext: resolvedContext,
  });
  const safeFrame = clamp(Math.round(Number(frame) || 0), 0, Math.max(0, durationInFrames - 1));
  const progress = durationInFrames <= 1 ? 0 : safeFrame / Math.max(1, durationInFrames - 1);

  const startPercent = resolvedContext.minPercent;
  const endPercent = resolvedContext.maxPercent;
  const phaseOneTargetPercent = clamp(
    toNumber(
      resolvedContext.phaseOneTargetPercent,
      DEFAULT_DEMO_MOTION_PROPS.phaseOneTargetPercent
    ),
    startPercent,
    endPercent
  );

  const phaseOneEndFrame = phaseOneFrames - 1;
  const pauseEndFrame = phaseOneFrames + pauseFrames - 1;
  const phaseOneProgress = safeFrame <= phaseOneEndFrame ? toProgress01(safeFrame, phaseOneFrames) : 1;

  let handleLeftPercent = startPercent;
  if (safeFrame <= phaseOneEndFrame) {
    const eased = easeOutPow(phaseOneProgress, resolvedContext.phaseOneEasePower);
    handleLeftPercent = startPercent + (phaseOneTargetPercent - startPercent) * eased;
  } else if (safeFrame <= pauseEndFrame) {
    handleLeftPercent = phaseOneTargetPercent;
  } else {
    const phaseTwoFrame = safeFrame - (pauseEndFrame + 1);
    const phaseProgress = toProgress01(phaseTwoFrame, phaseTwoFrames);
    const phaseTwoEaseType = normalizeEaseType(
      resolvedContext.phaseTwoEaseType,
      DEFAULT_DEMO_MOTION_PROPS.phaseTwoEaseType
    );
    const eased =
      phaseTwoEaseType === "linear"
        ? phaseProgress
        : phaseTwoEaseType === "easeInOut"
          ? easeInOutPow(phaseProgress, resolvedContext.phaseTwoEasePower)
          : easeOutPow(phaseProgress, resolvedContext.phaseTwoEasePower);
    handleLeftPercent = phaseOneTargetPercent + (endPercent - phaseOneTargetPercent) * eased;
  }

  return {
    ...resolvedContext,
    durationInFrames,
    frame: safeFrame,
    progress,
    phaseOneProgress,
    handleLeftPercent: clamp(handleLeftPercent, startPercent, endPercent),
  };
};
