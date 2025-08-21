import { useCallback, useState } from "react";
import { BASE_FILES, TOOTH_IDS } from "./constants";
import { preloadImages } from "./utils";

export const useImagePreloader = () => {
  const [filesTotal, setFilesTotal] = useState(0);
  const [filesLoaded, setFilesLoaded] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const preloadAllImages = useCallback(async () => {
    const files = [...BASE_FILES, ...TOOTH_IDS.map((id) => `1/${id}`)];

    setFilesTotal(files.length);
    setFilesLoaded(0);
    setIsLoaded(false);

    await preloadImages(files, setFilesLoaded);
    setIsLoaded(true);
  }, []);

  const loadingProgress = filesTotal > 0 ? (filesLoaded / filesTotal) * 100 : 0;

  return {
    isLoaded,
    loadingProgress,
    preloadAllImages,
    filesLoaded,
    filesTotal,
  };
};
