// utils/stringToColor.js
export function stringToHslColor(str, s = 70, l = 50) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      // A simple hash function
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
  
    // Use the hash to pick a hue in [0, 360)
    const h = hash % 360;
  
    // Return an HSL color string
    return `hsl(${h}, ${s}%, ${l}%)`;
  }
  