export const guestDemoMetrics = [
  ["Live occupancy", "47", "estimated now"],
  ["Unique visitors", "128", "global identities"],
  ["Active cameras", "4 / 4", "all processing"],
  ["Entries", "82", "today"],
  ["Exits", "35", "today"],
  ["High traffic zone", "Zone B", "12:00-14:00"],
] as const;

export const guestDemoSteps = [
  { icon: "▣", title: "Camera", detail: "RTSP, USB, or IP cameras capture the store environment." },
  { icon: "◎", title: "YOLO detection", detail: "Each frame is scanned to detect people with high confidence." },
  { icon: "⌁", title: "ByteTrack", detail: "Local tracks follow each detected person across consecutive frames." },
  { icon: "✦", title: "Re-identification", detail: "A visual embedding helps recognize the same anonymous person elsewhere." },
  { icon: "◈", title: "Global identity", detail: "Local camera IDs map to one stable identity, such as GP_000123." },
  { icon: "↕", title: "Entry / exit engine", detail: "Crossing events update occupancy and visitor totals." },
  { icon: "◌", title: "Live state", detail: "Redis keeps the current picture fast and available." },
  { icon: "▤", title: "History", detail: "PostgreSQL stores the events that power reporting." },
] as const;

export const guestDemoCameras = [
  ["Camera 01", "12", "Entrance", "24 FPS", "42 local tracks"],
  ["Camera 02", "18", "Zone A", "25 FPS", "17 local tracks"],
  ["Camera 03", "9", "Zone B", "24 FPS", "8 local tracks"],
  ["Camera 04", "8", "Exit", "25 FPS", "11 local tracks"],
] as const;

export const guestDemoJourney = [
  ["10:02:13", "Customer enters store", "Camera 01 detects a person"],
  ["10:03:21", "Customer moves to Zone A", "Local track continues"],
  ["10:05:47", "Camera 02 sees the same person", "Re-ID match begins"],
  ["10:05:48", "Identity matched", "GP_000123 at 94.7% confidence"],
  ["10:08:12", "Customer exits", "Camera 04 records an exit event"],
  ["10:08:13", "Occupancy updated", "One unique visitor, one completed journey"],
] as const;

export const guestDemoFeatureCards = [
  ["Occupancy", "The estimated number of customers currently inside the monitored area."],
  ["Entry / exit", "Tracks movement through configured entry and exit zones."],
  ["Unique visitors", "Counts distinct global identities instead of adding camera totals."],
  ["Camera health", "Shows whether cameras are online and processing frames correctly."],
  ["Traffic zones", "Highlights areas receiving more customer activity over time."],
  ["Global identity", "Represents the same anonymous person across multiple cameras."],
] as const;
