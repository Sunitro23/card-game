import React from "react";

function getViewportState() {
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

export function useViewport() {
  const [viewport, setViewport] = React.useState(getViewportState);

  React.useEffect(() => {
    const onResize = () => setViewport(getViewportState());
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  const isMobile = viewport.width <= 700;
  const isMobilePortrait = isMobile && viewport.height >= viewport.width;
  const isMobileLandscape = viewport.width <= 950 && viewport.height <= 520 && viewport.width > viewport.height;

  return {
    viewport,
    isMobile,
    isMobilePortrait,
    isMobileLandscape
  };
}
