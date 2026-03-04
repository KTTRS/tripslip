export const breakpoints = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
  ultrawide: 2560,
} as const;

export const isWithinViewport = (width: number): boolean => {
  return width >= breakpoints.mobile && width <= breakpoints.ultrawide;
};

export const getBreakpoint = (width: number): keyof typeof breakpoints => {
  if (width >= breakpoints.ultrawide) return 'ultrawide';
  if (width >= breakpoints.wide) return 'wide';
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'mobile';
};
