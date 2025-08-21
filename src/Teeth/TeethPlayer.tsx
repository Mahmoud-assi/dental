import { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import SkipNextIcon from "@mui/icons-material/SkipNext";
import SkipPreviousIcon from "@mui/icons-material/SkipPrevious";
import ReplayIcon from "@mui/icons-material/Replay";
import type { SceneObj, Step, StepsResponse } from "./general/types";
import { BASE_URL } from "./general/constants";
import { useImagePreloader } from "./general/hooks";
import { getSceneObjectStyle } from "./general/utils";
import { CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import ToothAnimation from "./ToothAnimation";
import ToolAnimation from "./ToolAnimation";
import TitleAnimation from "./TitleAnimation";

interface TeethPlayerProps {
  width?: number;
  data: StepsResponse;
  onStepComplete?(step: Step): void;
  onAllStepsComplete?(): void;
  autoPlay?: boolean;
}

export default function TeethPlayer({
  width = 300,
  data,
  onStepComplete,
  onAllStepsComplete,
  autoPlay = false,
}: TeethPlayerProps) {
  const [currentScene, setCurrentScene] = useState<SceneObj[]>(data.status);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [showTool, setShowTool] = useState<boolean>(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [animationState, setAnimationState] = useState<
    "idle" | "animating" | "completed"
  >("idle");
  const { isLoaded, preloadAllImages } = useImagePreloader();
  const currentStep = data.steps[currentStepIndex];
  const allStepsCompleted = completedSteps.size >= data.steps.length;

  useEffect(() => {
    preloadAllImages();
  }, [preloadAllImages]);

  const revertStepChanges = useCallback((step: Step) => {
    setCurrentScene((prevScene) => {
      if (step.type === "bridge" || step.type === "crown") {
        return prevScene.map((obj) => {
          if (obj.tooth_id === step.toothId) {
            return { ...obj, hidden: "1", animated: false };
          }
          return obj;
        });
      }

      if (step.type === "filling") {
        return prevScene.map((obj) => {
          if (obj.tooth_id === step.toothId) {
            return {
              ...obj,
              src: `3/${step.toothId}`,
              hidden: "0",
              animated: false,
            };
          }
          return obj;
        });
      }

      if (step.type === "implant") {
        // If implant hid the tooth, reverting should show it again
        return prevScene.map((obj) => {
          if (obj.tooth_id === step.toothId) {
            return { ...obj, hidden: "0", animated: false };
          }
          return obj;
        });
      }

      return prevScene;
    });
  }, []);

  const completeCurrentStep = useCallback(() => {
    const step = data.steps[currentStepIndex];

    // Update completed steps
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(step.id);
      return next;
    });

    // Update scene with the completed step's changes
    setCurrentScene((prev) =>
      prev.map((obj) => {
        if (obj.tooth_id !== step.toothId) return obj;

        switch (step.type) {
          case "filling":
            return {
              ...obj,
              src: `1/${step.toothId}`,
              hidden: "0",
              animated: false,
            };
          case "bridge":
          case "crown":
            return { ...obj, hidden: "0", animated: true };
          case "implant":
            return { ...obj, hidden: "1", animated: false };
          default:
            return obj;
        }
      })
    );

    setShowTool(false);
    setAnimationState("completed");
    onStepComplete?.(step);

    // Move to next step or finish
    if (currentStepIndex < data.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setAnimationState("idle");
    } else {
      setIsPlaying(false);
      setAnimationState("completed");
      onAllStepsComplete?.();
    }
  }, [currentStepIndex, data.steps, onAllStepsComplete, onStepComplete]);

  const handleToolAnimationComplete = useCallback(() => {
    setAnimationState("completed");
    completeCurrentStep();
  }, [completeCurrentStep]);

  // Auto-play and step progression
  useEffect(() => {
    if (!isPlaying || allStepsCompleted || !isLoaded || !currentStep) return;

    setAnimationState("animating");
    setShowTool(false);

    const playStep = () => {
      if (currentStep.tool) setTimeout(() => setShowTool(true), 100);
      else setTimeout(() => completeCurrentStep(), 2000);
    };

    playStep();
  }, [
    isPlaying,
    currentStepIndex,
    isLoaded,
    allStepsCompleted,
    currentStep,
    completeCurrentStep,
  ]);

  const handlePlayPause = () => {
    if (isPlaying) {
      setIsPlaying(false);
      setAnimationState("idle");
    } else {
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    handleReset();
    setIsPlaying(true);
  };

  // ✅ NEXT: complete current, move forward (completeCurrentStep already bumps index),
  // then ensure the NEW step starts animating
  const handleNextStep = () => {
    if (allStepsCompleted) return;

    const step = data.steps[currentStepIndex];
    const isAlreadyCompleted = completedSteps.has(step.id);

    if (!isAlreadyCompleted) {
      // completes current and advances index
      completeCurrentStep();
    } else if (currentStepIndex < data.steps.length - 1) {
      // step was already completed; just move forward
      setCurrentStepIndex((prev) => prev + 1);
      setAnimationState("idle");
    }

    // start animating the next step
    setShowTool(false);
    setIsPlaying(true);
  };

  // ✅ PREV: revert the previous step and move back one
  const handlePreviousStep = () => {
    if (currentStepIndex <= 0) return;

    const prevStepIndex = currentStepIndex - 1;
    const stepToRevert = data.steps[prevStepIndex];

    revertStepChanges(stepToRevert);

    setCurrentStepIndex(prevStepIndex);
    setShowTool(false);
    setAnimationState("idle");
    setIsPlaying(false);

    // remove it from completed steps
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.delete(stepToRevert.id);
      return next;
    });
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setCurrentScene(data.status);
    setCompletedSteps(new Set());
    setIsPlaying(false);
    setShowTool(false);
    setAnimationState("idle");
  };

  if (!isLoaded) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        gap: 2,
      }}
    >
      {/* Controls */}
      <Stack alignItems="center" direction="row">
        <IconButton
          onClick={handlePreviousStep}
          disabled={currentStepIndex === 0}
        >
          <SkipPreviousIcon />
        </IconButton>

        {allStepsCompleted ? (
          <IconButton onClick={handleReplay}>
            <ReplayIcon />
          </IconButton>
        ) : (
          <IconButton onClick={handlePlayPause}>
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
        )}

        <IconButton
          onClick={handleNextStep}
          disabled={allStepsCompleted || currentStepIndex >= data.steps.length}
        >
          <SkipNextIcon />
        </IconButton>
      </Stack>

      {/* Progress indicator */}
      <Typography variant="body2" color="text.secondary">
        Step {Math.min(currentStepIndex + 1, data.steps.length)} of{" "}
        {data.steps.length}: {currentStep?.title}
      </Typography>

      {/* Teeth visualization */}
      <Box
        sx={{
          position: "relative",
          width,
          height: 1100 * (width / 700),
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 700,
            height: 1100,
            transform: `scale(${width / 700})`,
            transformOrigin: "top left",
          }}
        >
          {/* Base jaw image */}
          <Box
            component="img"
            src={`${BASE_URL}base.png`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              zIndex: 0,
              width: "100%",
              height: "100%",
            }}
          />

          {/* All teeth */}
          {currentScene
            .filter((obj) => !obj.tool && obj.hidden !== "1")
            .map((sceneObj) => (
              <Box
                component="img"
                key={sceneObj.unique_key}
                src={`${BASE_URL}${sceneObj.src}.png`}
                style={getSceneObjectStyle(sceneObj)}
              />
            ))}

          {/* Animated Teeth */}
          <ToothAnimation
            scene={currentScene}
            animatedTeethVisible={animationState === "animating"}
            activeToothId={currentStep?.toothId}
          />

          {/* Title animation */}
          {currentStep && animationState === "animating" && (
            <TitleAnimation
              title={currentStep?.title_animation!}
              isVisible={currentStep && animationState === "animating"}
            />
          )}

          {/* Base mask */}
          <Box
            component="img"
            src={`${BASE_URL}base-mask.png`}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              zIndex: 9999,
              width: "100%",
              height: "100%",
            }}
          />

          {/* Tool animation */}
          {currentStep?.tool && (
            <ToolAnimation
              scene={currentScene}
              visible={showTool && isPlaying}
              tool={currentStep.tool}
              activeToothId={currentStep.toothId}
              onAnimationComplete={handleToolAnimationComplete}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
