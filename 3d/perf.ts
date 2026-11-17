// Measured numbers for the /3d/ write-up. How each was measured is in 3d/README.md.
export const PERF = {
  modelKb: 43, modelRawKb: 222, modelGzKb: 19,
  chunkGzKb: 255,
  rows: [
    ['3D code on the home page', '0 KB', 'Built main before and after: the home page bundle grew only by the new project card (10.57 → 10.82 KB gzipped), and in a browser it makes no request for any 3D file.'],
    ['/3d/ on a phone, before the tap', '173 KB · LCP 1.8 s · TBT 20 ms · score 98', 'Lighthouse mobile (slow 4G, 4× slower CPU). The still picture is the largest paint. No 3D code is downloaded until the tap.'],
    ['The 3D chunk', '255 KB gzipped', 'three.js itself is about 72% of it, React Three Fiber 14%, the glTF loader and meshopt decoder 7%, my viewer code 1%. Deep imports from drei and my own lighting (instead of drei’s Environment) cut 20 KB.'],
    ['The mug model', '43 KB (222 KB raw)', 'Meshopt compression and quantized vertices with gltf-transform. About 9,000 triangles in 6 meshes, 3 materials, no textures. The still picture is a 14 KB WebP.'],
    ['/3d/ on a laptop, with 3D', '465 KB · LCP 0.5 s · TBT 1.06 s', 'Lighthouse desktop. Almost all of the blocking time is one task: compiling shaders and baking the lighting. The test machine has no GPU, so WebGL runs on the CPU, which makes this a worst case.'],
    ['Frame rate while rotating', '11.7 fps (software, no GPU)', 'Frames counted for 5 s in headless Chrome with software WebGL at 1280 px. PerformanceMonitor saw the slow frames and dropped the pixel ratio to 1 by itself. Turn on “Show frame rate” to see your own device’s number.'],
    ['Frames when nothing moves', '0 per second', 'Auto-rotate off and no dragging: the canvas renders nothing. Scrolled out of view: also 0, even with auto-rotate on.'],
  ] as [string, string, string][],
  note: 'One honest caveat: the 255 KB of 3D code is a lot for a mug. Most of it is three.js, which React Three Fiber pulls in whole. That is why it only loads on this page, only when you reach the viewer, and only after a tap on phones. The small layout shift Lighthouse reports comes from the web fonts swapping into the heading, like every page on this site; the 3D stage itself causes none, because the picture and the canvas are the same size.',
};
