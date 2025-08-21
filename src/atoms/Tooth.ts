import { atom } from "jotai";
import type { Step, SceneObj } from "../Teeth/general/types";

export const CurrentStepAtom = atom<Step>({} as Step);

export const CurrentSceneAtom = atom<SceneObj[]>([]);

export const StepIndexAtom = atom(0);

export const CompletedStepsAtom = atom<Set<string>>(new Set() as Set<string>);
