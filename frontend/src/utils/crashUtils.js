export const extractExceptionType = (signature) => {
  if (!signature) return "Unknown";
  const match = signature.match(/([A-Za-z0-9_.]+Exception)/);
  return match ? match[1] : "Other";
};

export const getPlayerName = (c) => {
  return c?.playerName || 
         c?.player?.username || 
         c?.username || 
         c?.user?.username || 
         c?.lastPlayer || 
         c?.example?.playerName ||
         c?.example?.username ||
         c?.examplePlayer ||
         "Unknown";
};

export const getCrashReason = (c) => {
  return c?.signature || 
         c?.reason || 
         c?.summary || 
         c?.error || 
         c?.message || 
         "No reason provided";
};

export const getFilteredCrashContent = (content) => {
  if (!content) return "";
  const splitIndex = content.indexOf("==========================================================================================\n");
  return splitIndex === -1 ? content : content.substring(0, splitIndex).trim();
};

export const getSystemInfoContent = (content) => {
  if (!content) return "";
  
  const systemInfoStart = content.indexOf("==========================================================================================\n");
  if (systemInfoStart === -1) return "";
  
  let systemContent = content.substring(systemInfoStart);
  const lines = systemContent.split('\n');
  const filteredLines = [];
  let skipMode = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith("??????????????????????????????????????????????")) {
      skipMode = !skipMode;
      continue;
    }
    
    if (skipMode) continue;
    
    if (!skipMode && !line.startsWith("??????????????????????????????????????????????")) {
      filteredLines.push(lines[i]);
    }
  }
  
  return filteredLines.join('\n').trim();
};