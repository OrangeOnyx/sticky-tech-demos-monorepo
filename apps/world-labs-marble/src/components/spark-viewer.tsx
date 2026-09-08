import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { SparkRenderer, SplatMesh, SparkControls } from "@sparkjsdev/spark"

type Props = {
  url: string
}

export function SparkViewer({ url }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState("Loading Gaussian splat…")

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let disposed = false
    let frame = 0
    let renderer: THREE.WebGLRenderer | null = null
    let controls: SparkControls | null = null
    let splat: SplatMesh | null = null

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 200)
    camera.position.set(0, 0, 0.01)

    renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    host.appendChild(renderer.domElement)

    const spark = new SparkRenderer({ renderer })
    scene.add(spark)

    splat = new SplatMesh({
      url,
      onProgress(event) {
        if (event.lengthComputable && event.total) {
          const pct = Math.round((event.loaded / event.total) * 100)
          setStatus(`Loading splat ${pct}%`)
        }
      },
      onLoad() {
        setStatus("")
      },
    })
    splat.quaternion.set(1, 0, 0, 0)
    scene.add(splat)

    controls = new SparkControls({ canvas: renderer.domElement })

    const resize = () => {
      if (!renderer) return
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
      if (disposed || !renderer || !controls) return
      frame = requestAnimationFrame(animate)
      controls.update(camera)
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      splat?.removeFromParent()
      spark.removeFromParent()
      renderer?.dispose()
      if (renderer?.domElement.parentElement === host) {
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
          Spark splat viewer · drag to look
        </p>
      )}
    </div>
  )
}
