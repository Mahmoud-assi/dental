import { motion, AnimatePresence } from "framer-motion";
import { Typography, Box } from "@mui/material";

interface TitleAnimationProps {
  title: string;
  duration?: number;
  onAnimationComplete?(): void;
}

export default function TitleAnimation({
  title,
  duration = 1.5,
  onAnimationComplete,
}: TitleAnimationProps) {
  return (
    <AnimatePresence onExitComplete={onAnimationComplete}>
      <Box
        sx={{
          position: "absolute",
          zIndex: 9999 + 1,
          top: 500,
          left: 0,
          right: 0,
          width: "100%",
          textAlign: "center",
        }}
        key={title}
      >
        <Box
          component={motion.div}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            duration,
            ease: "easeInOut",
          }}
          onAnimationComplete={onAnimationComplete}
        >
          <Typography
            variant="h6"
            sx={{
              color: "primary.dark",
              fontSize: 30,
            }}
          >
            {title}
          </Typography>
        </Box>
      </Box>
    </AnimatePresence>
  );
}
