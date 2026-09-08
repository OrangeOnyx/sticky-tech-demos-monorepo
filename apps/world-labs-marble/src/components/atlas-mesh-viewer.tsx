import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"

type Props = {
  url: string
}

export function AtlasMeshViewer({ url }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState("Loading GLB mesh…")

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let frame = 0
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x141414)

    const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 400)
    camera.position.set(18, 22, 28)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 0, 0)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.1))
    const sun = new THREE.DirectionalLight(0xffffff, 1.4)
    sun.position.set(12, 24, 8)
    scene.add(sun)

    const loader = new GLTFLoader()
    loader.load(
      url,
      (gltf) => {
        if (disposed) return
        const root = gltf.scene
        const box = new THREE.Box3().setFromObject(root)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        root.position.sub(center)
        const maxDim = Math.max(size.x, size.y, size.z) || 1
        const scale = 16 / maxDim
        root.scale.setScalar(scale)
        scene.add(root)
        setStatus("")
      },
      (event) => {
        if (event.lengthComputable && event.total) {
          setStatus(`Loading mesh ${Math.round((event.loaded / event.total) * 100)}%`)
        }
      },
      () => {
        if (!disposed) setStatus("Could not load OTB-mesh.glb")
      },
    )

    const resize = () => {
      const width = host.clientWidth
      const height = Math.max(host.clientHeight, 320)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(host)

    const animate = () => {
      if (disposed) return
      frame = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement)
      }
    }
  }, [url])

  return (
    <div className="relative min-h-80">
      <div ref={hostRef} className="min-h-80 w-full" />
      {status ? (
        <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-zinc-200">
          {status}
        </p>
      ) : (
        <p className="pointer-events-none absolute bottom-3 left-3 text-xs text-zinc-200/90">
          Atlas GLB · drag to orbit
        </p>
      )}
    </div>
  )
}
