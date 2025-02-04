export function toIsoDateString(dateObjOrStr) {
    // If it's already "YYYY-MM-DD", just return it.
    if (/\d{4}-\d{2}-\d{2}/.test(dateObjOrStr)) return dateObjOrStr;
  
    // Otherwise, parse and reformat.
    const d = new Date(dateObjOrStr);
    return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
  }
  