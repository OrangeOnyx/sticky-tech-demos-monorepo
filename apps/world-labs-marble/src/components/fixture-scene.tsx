import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

type Props = {
  seed: string
}

function hashSeed(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function colorFrom(hash: number, shift: number, s: number, l: number): THREE.Color {
  const hue = ((hash >>> shift) & 255) / 255
  return new THREE.Color().setHSL(hue, s, l)
}

export function FixtureScene({ seed }: Props) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const hash = hashSeed(seed)
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(colorFrom(hash, 8, 0.35, 0.18), 8, 42)

    const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 80)
    camera.position.set(0.4, 1.4, 4.2)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(0, 1.1, 0)
    controls.maxPolarAngle = Math.PI * 0.49
    controls.minDistance = 1.4
    controls.maxDistance = 12

    const sky = new THREE.HemisphereLight(
      colorFrom(hash, 16, 0.45, 0.72),
      colorFrom(hash, 24, 0.3, 0.18),
      1.1,
    )
    scene.add(sky)

    const sun = new THREE.DirectionalLight(colorFrom(hash, 4, 0.55, 0.78), 2.1)
    sun.position.set(6, 8, 3)
    sun.castShadow = true
    scene.add(sun)

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(18, 48),
      new THREE.MeshStandardMaterial({
        color: colorFrom(hash, 12, 0.28, 0.22),
        roughness: 0.95,
      }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    const water = new THREE.Mesh(
      new THREE.CircleGeometry(16, 48),
      new THREE.MeshStandardMaterial({
        color: colorFrom(hash, 20, 0.55, 0.28),
        roughness: 0.15,
        metalness: 0.35,
      }),
    )
    water.rotation.x = -Math.PI / 2
    water.position.set(10, 0.02, -6)
    scene.add(water)

    const keep = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 3.2, 2.4),
      new THREE.MeshStandardMaterial({
        color: colorFrom(hash, 2, 0.12, 0.42),
        roughness: 0.85,
      }),
    )
    keep.position.set(-1.1, 1.6, -0.4)
    keep.castShadow = true
    scene.add(keep)

    const tower = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.55, 4.2, 10),
      new THREE.MeshStandardMaterial({
        color: colorFrom(hash, 6, 0.18, 0.38),
        roughness: 0.8,
      }),
    )
    tower.position.set(1.5, 2.1, -1.2)
    tower.castShadow = true
    scene.add(tower)

    const ivy = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.7, 1),
      new THREE.MeshStandardMaterial({
        color: colorFrom(hash, 10, 0.55, 0.32),
        roughness: 0.7,
      }),
    )
    ivy.position.set(-0.2, 0.7, 1.1)
    ivy.castShadow = true
    scene.add(ivy)

    const lantern = new THREE.PointLight(colorFrom(hash, 0, 0.7, 0.7), 6, 12)
    lantern.position.set(0.6, 2.2, 1.4)
    scene.add(lantern)

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

    let frame = 0
    const animate = () => {
      frame = requestAnimationFrame(animate)
      ivy.rotation.y += 0.004
      water.rotation.z += 0.0008
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      renderer.dispose()
      host.removeChild(renderer.domElement)
    }
  }, [seed])

  return (
    <div className="relative min-h-80">
      <div ref={hostRef} className="min-h-80 w-full" />
      <p className="pointer-events-none absolute bottom-3 left-3 right-3 text-xs text-zinc-200/90">
        Fixture sample · drag to look · scroll to zoom
      </p>
    </div>
  )
}
