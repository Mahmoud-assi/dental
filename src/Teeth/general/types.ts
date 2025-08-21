export type PlayerParams = {
  controls?: boolean;
  language?: "en" | "de" | string;
};

export interface SceneObj {
  src: string;
  position: { x?: number; y?: number; z?: number };
  unique_key: string;
  hidden?: string | number | boolean;
  tooth_id?: number;
  tool?: "drill" | "laser";
  animated?: boolean;
}

export interface Step {
  id: string;
  ordering: number;
  title: string;
  title_animation?: string;
  toothId: number;
  type: "bridge" | "filling" | "implant" | "crown";
  tool?: "drill" | "laser" | null;
}

export interface StepsResponse {
  steps: Step[];
  status: SceneObj[];
}
