import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

const CROSSFADE_S = 0.3

type ViewerApi = {
  mixer: THREE.AnimationMixer
  actions: Map<string, THREE.AnimationAction>
  current: THREE.AnimationAction | null
  skeleton: THREE.SkeletonHelper
  play: (name: string | null) => void
}

type RigViewerProps = {
  glbUrl: string | null
  clipName: string | null
  showSkeleton: boolean
  playing: boolean
  onClips: (names: string[]) => void
  onReady: () => void
  onError: (message: string) => void
}

function disposeMaterial(material: THREE.Material) {
  for (const value of Object.values(material)) {
    if (value instanceof THREE.Texture) value.dispose()
  }
  material.dispose()
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    mesh.geometry?.dispose()
    if (Array.isArray(mesh.material)) mesh.material.forEach(disposeMaterial)
    else if (mesh.material) disposeMaterial(mesh.material)
  })
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") {
    return error.message
  }
  return "Could not load the GLB."
}

function RigCanvas({
  glbUrl,
  clipName,
  showSkeleton,
  playing,
  onClips,
  onReady,
  onError,
}: Omit<RigViewerProps, "glbUrl"> & { glbUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const apiRef = useRef<ViewerApi | null>(null)
  const clipRef = useRef(clipName)
  const skeletonRef = useRef(showSkeleton)
  const playingRef = useRef(playing)
  const callbacks = useRef({ onClips, onReady, onError })

  useEffect(() => {
    clipRef.current = clipName
    skeletonRef.current = showSkeleton
    playingRef.current = playing
    callbacks.current = { onClips, onReady, onError }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let disposed = false
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf4f4f5)
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100)
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 1, 0)

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b8b8, 1.2))
    const directional = new THREE.DirectionalLight(0xffffff, 1.7)
    scene.add(directional)
    scene.add(directional.target)

    const loader = new GLTFLoader()
    loader.load(
      glbUrl,
      (gltf) => {
        if (disposed) {
          disposeObject(gltf.scene)
          return
        }
        const root = gltf.scene
        scene.add(root)
        const box = new THREE.Box3().setFromObject(root)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z, 0.001)
        controls.target.copy(center)
        camera.position.set(center.x + maxDim * 0.85, center.y + maxDim * 0.4, center.z + maxDim * 1.55)
        camera.near = maxDim / 80
        camera.far = maxDim * 40
        camera.updateProjectionMatrix()
        directional.position.set(center.x + maxDim, center.y + maxDim * 2, center.z + maxDim)
        directional.target.position.copy(center)

        const grid = new THREE.GridHelper(maxDim * 4, 12, 0xc4c4c4, 0xe4e4e7)
        grid.position.y = box.min.y
        scene.add(grid)

        const skeleton = new THREE.SkeletonHelper(root)
        skeleton.visible = skeletonRef.current
        skeleton.frustumCulled = false
        scene.add(skeleton)

        const mixer = new THREE.AnimationMixer(root)
        const actions = new Map<string, THREE.AnimationAction>()
        for (const clip of gltf.animations) {
          const action = mixer.clipAction(clip)
          action.clampWhenFinished = false
          actions.set(clip.name, action)
        }
        const names = gltf.animations.map((clip) => clip.name)
        const api: ViewerApi = {
          mixer,
          actions,
          current: null,
          skeleton,
          play(name) {
            if (!name) return
            const next = actions.get(name)
            if (!next || api.current === next) return
            const previous = api.current
            if (previous && previous !== next) previous.fadeOut(CROSSFADE_S)
            next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(CROSSFADE_S).play()
            api.current = next
          },
        }
        apiRef.current = api
        mixer.timeScale = playingRef.current ? 1 : 0
        const initial =
          clipRef.current && actions.has(clipRef.current)
            ? clipRef.current
            : (names.find((name) => /idle/i.test(name)) ?? names[0] ?? null)
        api.play(initial)
        callbacks.current.onClips(names)
        callbacks.current.onReady()
      },
      undefined,
      (error) => {
        if (!disposed) callbacks.current.onError(errorMessage(error))
      },
    )

    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      if (disposed) return
      const delta = Math.min((now - last) / 1000, 0.05)
      last = now
      const api = apiRef.current
      if (api) {
        api.skeleton.visible = skeletonRef.current
        api.mixer.timeScale = playingRef.current ? 1 : 0
        api.play(clipRef.current)
        api.mixer.update(delta)
      }
      controls.update()
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }

    const resize = () => {
      const width = canvas.clientWidth || 1
      const height = canvas.clientHeight || 1
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    frame = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      apiRef.current = null
      disposeObject(scene)
      renderer.dispose()
    }
  }, [glbUrl])

  return <canvas ref={canvasRef} className="block size-full" />
}

export function RigViewer(props: RigViewerProps) {
  return (
    <div className="relative h-[32rem] w-full bg-muted">
      {props.glbUrl ? (
        <RigCanvas key={props.glbUrl} {...props} glbUrl={props.glbUrl} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Drop a character image and press Generate. Sample mode loads a rigged robot with no API key.
        </div>
      )}
    </div>
  )
}
