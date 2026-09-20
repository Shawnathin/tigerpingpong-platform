// Cloud names are public delivery identifiers, not credentials. The default keeps
// static builds (including CI) able to render the public PaddleBuddy page; deploy
// environments can still set the public variable explicitly.
const cloudName = process.env.NEXT_PUBLIC_PADDLE_BUDDY_CLOUDINARY_CLOUD_NAME ?? "svl1myo8";

const imageBase = `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto`;
const videoBase = `https://res.cloudinary.com/${cloudName}/video/upload/q_auto`;
const publicIdBase = "paddlebuddy/landing/v1";

function image(publicId: string, version: number): string {
  return `${imageBase}/v${version}/${publicId}.png`;
}

function video(publicId: string, version: number, format: "mp4" | "webm"): string {
  return `${videoBase}/f_${format}/v${version}/${publicId}.${format}`;
}

export const paddleBuddyMedia = {
  browseDrills: image(`${publicIdBase}/browse-drills`, 1789913680),
  connectedPoster: image(`${publicIdBase}/connected-poster`, 1789913681),
  connectionLoopMp4: video(`${publicIdBase}/connection-loop`, 1789913681, "mp4"),
  connectionLoopWebm: video(`${publicIdBase}/connection-loop`, 1789913681, "webm"),
  drill: image(`${publicIdBase}/drill`, 1789913679),
  homeConnect: image(`${publicIdBase}/home-connect`, 1789913676)
} as const;
