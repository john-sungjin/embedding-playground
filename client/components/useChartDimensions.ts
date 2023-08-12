// Code from https://2019.wattenberger.com/blog/react-and-d3
// kinda sus tho lol
import { ResizeObserver } from "@juggle/resize-observer";
import { useEffect, useRef, useState } from "react";

interface Dimensions {
  width?: number;
  height?: number;
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
}

const combineChartDimensions = (dimensions: Dimensions) => {
  const parsedDimensions = {
    ...dimensions,
    width: dimensions.width || 0,
    height: dimensions.height || 0,
    marginTop: dimensions.marginTop || 0,
    marginRight: dimensions.marginRight || 0,
    marginBottom: dimensions.marginBottom || 0,
    marginLeft: dimensions.marginLeft || 0,
  };

  return {
    ...parsedDimensions,
    boundedHeight: Math.max(
      parsedDimensions.height -
        parsedDimensions.marginTop -
        parsedDimensions.marginBottom,
      0,
    ),
    boundedWidth: Math.max(
      parsedDimensions.width -
        parsedDimensions.marginLeft -
        parsedDimensions.marginRight,
      0,
    ),
  };
};

export const useChartDimensions = (passedSettings: Dimensions) => {
  const ref = useRef<any>();
  const dimensions = combineChartDimensions(passedSettings);

  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const element = ref.current;
    const resizeObserver = new ResizeObserver((entries) => {
      if (!Array.isArray(entries)) return;
      if (!entries.length) return;

      const entry = entries[0];

      if (width != entry.contentRect.width) setWidth(entry.contentRect.width);
      if (height != entry.contentRect.height)
        setHeight(entry.contentRect.height);
    });
    resizeObserver.observe(element);

    return () => resizeObserver.unobserve(element);
  }, []);

  const dims = combineChartDimensions({
    ...dimensions,
    width: dimensions.width || width,
    height: dimensions.height || height,
  });

  return { ref, dims };
};
