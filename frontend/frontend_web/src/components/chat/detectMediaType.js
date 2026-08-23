// Maps a browser File's mime type to your backend's MessageType enum.
export function detectMediaType(file) {
  if (!file) return null;
  const mime = file.type || "";

  if (mime.startsWith("image/")) return "IMAGE";
  if (mime.startsWith("video/")) return "VIDEO";
  return "DOC"; 
}