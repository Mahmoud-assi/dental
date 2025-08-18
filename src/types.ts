export type PlayerParams = {
  controls?: boolean;
  language?: "en" | "de" | "hu" | string;
};

export type SceneObj = {
  src: string;
  unique_key: string;
  part?: string;
  group_id?: number;
  position?: { x?: number; y?: number; z?: number };
  hidden?: string | number | boolean;
  animation?: { animation: string; duration: string; delay: number } | null;
  loaded?: boolean;
  // runtime only
  tool?: string; // e.g., "drill", "laser"
  tooth_id?: number;
};

export type StepAnimation = {
  callback: string; // Name of method to call
  start: number; // ms delay or similar semantics retained from original
  moveDuration?: number;
  moveDelay?: number;
  fadeDuration?: number;
  effect?: Record<string, any>;
  unique_key?: string;
  tool?: string;
  tooth_id?: number;
  correct_angle?: boolean;
  yOffset?: number;
  angle?: "vertical" | "circular";
  groupId?: number;
  current_state?: { state_pid: string | number; part: string };
};

export type Step = {
  title?: string;
  base: SceneObj[];
  animations?: StepAnimation[];
  procedureIdx?: number[];
};

export type PmAnimationViewerProps = {
  status?: any[];
  steps?: any[]; // unused parity
  playerParams?: PlayerParams;
  /** Parsed queue data. If not provided, `queueDataBase64` is used. */
  queue?: Step[];
  /** Base64-encoded JSON of queue data (same shape as `queue`). */
  queueDataBase64?: string;
  autoplay?: boolean;
  debug?: boolean;
};
