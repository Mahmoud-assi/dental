import {
  BASE_URL,
  DRILL_POSITIONS,
  ExtraSmall_GUMS_POSITIONS,
  TEETH_POSITIONS,
  TOOTH_REGIONS,
} from "./constants";
import type { SceneObj } from "./types";

export const preloadImages = (
  files: string[],
  onProgress: (loaded: number) => void
): Promise<void> => {
  return new Promise((resolve) => {
    let loaded = 0;
    const total = files.length;

    if (total === 0) {
      resolve();
      return;
    }

    files.forEach((file) => {
      const img = new Image();
      img.src = `${BASE_URL}${file}.png`;
      img.onload = img.onerror = () => {
        loaded += 1;
        onProgress(loaded);
        if (loaded === total) resolve();
      };
    });
  });
};

export const getSceneObjectStyle = (
  sceneObj: SceneObj
): React.CSSProperties => {
  const styles: React.CSSProperties = {
    position: "absolute",
    willChange: "opacity, top, left, transform",
  };

  if (sceneObj.position?.x !== undefined) styles.left = sceneObj.position.x;
  if (sceneObj.position?.y !== undefined) styles.top = sceneObj.position.y;
  if (sceneObj.position?.z !== undefined) styles.zIndex = sceneObj.position.z;

  if (
    sceneObj.hidden === "1" ||
    sceneObj.hidden === 1 ||
    sceneObj.hidden === "true" ||
    sceneObj.hidden === true
  ) {
    styles.opacity = 0;
    // styles.display = "none";
  }

  return styles;
};

export const getTeethPositions = () => {
  const positions: Record<number, { x: number; y: number; z: number }> = {};
  Object.entries(TEETH_POSITIONS).forEach(([id, pos]) => {
    positions[parseInt(id)] = { ...pos };
  });
  return positions;
};

export const getExtraSmallGumsPositions = () => {
  const positions: Record<number, { x: number; y: number; z: number }> = {};
  Object.entries(ExtraSmall_GUMS_POSITIONS).forEach(([id, pos]) => {
    positions[parseInt(id)] = { ...pos };
  });
  return positions;
};

export const getToothRegion = (id: number) => Math.floor(id / 10);

export const getDrillPosition = (toothId?: number) => {
  if (!toothId) return undefined;
  const pos = DRILL_POSITIONS[toothId];
  return pos ? { ...pos } : undefined;
};

export const getToolTransformations = (region: number) => {
  if (region === TOOTH_REGIONS.UPPER_RIGHT)
    return { rotateZ: 0, scaleX: 1.001, scaleY: 1.001 };
  if (region === TOOTH_REGIONS.UPPER_LEFT)
    return { rotateZ: 0, scaleX: -1, scaleY: 1.001 };
  if (region === TOOTH_REGIONS.LOWER_LEFT)
    return { rotateZ: 180, scaleX: 1, scaleY: 1 };
  if (region === TOOTH_REGIONS.LOWER_RIGHT)
    return { rotateZ: 0, scaleX: 1.001, scaleY: -1 };
  return { rotateZ: 0, scaleX: 1, scaleY: 1 };
};
