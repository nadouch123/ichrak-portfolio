// Measured numbers for the /3d/ write-up. How each was measured is in 3d/README.md.
export const PERF = {
  chunkGzKb: 233,
  posterKb: 52,
  rows: [
    ['3D code on the home page', '0 KB', 'Lighthouse on the home page lists no request for any 3D file, and its score stays at 99. The home bundle only gained the new project card (10.65 KB gzipped in total).'],
    ['/3d/ on a phone, before the tap', '214 KB · LCP 1.9 s · TBT 90 ms · CLS 0 · score 98', 'Lighthouse mobile (slow 4G, 4× slower CPU). The still picture is the largest paint. No 3D code is downloaded until the tap.'],
    ['The 3D chunk', '233 KB gzipped', 'Almost all of it is three.js and React Three Fiber. My scene code (graph data, shaders, labels) is a few KB. There is no model file and no texture to download: the geometry is built in code.'],
    ['/3d/ on a laptop, with 3D', '444 KB · LCP 0.4 s · TBT 240 ms · score 92', 'Lighthouse desktop. Most of the blocking time is compiling the three shaders. The test machine has no GPU, so WebGL runs on the CPU: a worst case.'],
    ['Frame rate while it moves', '55 fps (software, no GPU)', 'Frames counted for 5 s in headless Chrome with software WebGL at 1280 px, with data flow and auto-rotate on. The pulses and the wave run in shaders, so the CPU only updates 28 nodes a frame. Turn on “Show frame rate” to see your own device’s number.'],
    ['Frames when nothing moves', '0 per second', 'Data flow and auto-rotate off: the canvas renders nothing until you touch it. Scrolled out of view: also 0, even with everything on.'],
  ] as [string, string, string][],
  note: 'One honest caveat: 233 KB of 3D code is real weight, and most of it is three.js, which React Three Fiber pulls in whole. That is why it only loads on this page, only when you reach the viewer, and only after a tap on phones. Every fancy effect (glow, moving data, the forward pass, the 1,600 points) is a small shader instead of a post-processing pass, which keeps it at full speed even without a GPU.',
};
