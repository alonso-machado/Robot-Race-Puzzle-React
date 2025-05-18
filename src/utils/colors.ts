 // Helper function to get color with opacity
export const getColorWithOpacity = (color: string, opacity: number): string => {
  const colors: Record<string, string> = {
    red: `rgba(252, 165, 165, ${opacity})`,
    green: `rgba(134, 239, 172, ${opacity})`,
    blue: `rgba(147, 197, 253, ${opacity})`,
    purple: `rgba(216, 180, 254, ${opacity})`
  };
  return colors[color] || color;
};