import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { OTB_FLOORPLAN_URL, OTB_THUMBNAIL_URL } from "@shared/otb"

function box(
  scene: THREE.Scene,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: number,
  extra?: Partial<THREE.MeshStandardMaterialParameters>,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }),
  )
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  scene.add(mesh)
  return mesh
}

export function FixtureScene() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x87a0b8)
    scene.fog = new THREE.Fog(0x87a0b8, 18, 55)

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80)
    camera.position.set(-2.4, 6.2, 11.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.target.set(1.5, 0.6, 1.2)
    controls.maxPolarAngle = Math.PI * 0.48
    controls.minDistance = 4
    controls.maxDistance = 24

    scene.add(new THREE.HemisphereLight(0xf3f0e8, 0x4a5a3a, 1.05))
    const sun = new THREE.DirectionalLight(0xfff4dd, 1.8)
    sun.position.set(-8, 14, 6)
    sun.castShadow = true
    scene.add(sun)

    const parking = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 36),
      new THREE.MeshStandardMaterial({ color: 0x8b9096, roughness: 1 }),
    )
    parking.rotation.x = -Math.PI / 2
    parking.receiveShadow = true
    scene.add(parking)

    const loader = new THREE.TextureLoader()
    loader.load(OTB_THUMBNAIL_URL, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      parking.material.map = texture
      parking.material.color.set(0xffffff)
      parking.material.needsUpdate = true
    })

    const walkwayMat = new THREE.MeshStandardMaterial({
      color: 0x9ec5e8,
      roughness: 0.7,
    })
    const walkH = new THREE.Mesh(new THREE.BoxGeometry(18.4, 0.06, 1.6), walkwayMat)
    walkH.position.set(-0.4, 0.04, -1.55)
    walkH.receiveShadow = true
    scene.add(walkH)
    const walkV = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 10.2), walkwayMat)
    walkV.position.set(7.7, 0.04, 2.6)
    walkV.receiveShadow = true
    scene.add(walkV)

    const roof = 0xe8e6e1
    const tan = 0xc4b49a
    const white = 0xf2f0ea
    const unitWidths = [2.4, 1.2, 1.1, 1.4, 1.2, 1.3, 1.1, 1.5, 1.2, 1.1, 1.3, 1.2, 1.4, 1.1, 1.6]
    let cursor = -8.6
    for (const [index, width] of unitWidths.entries()) {
      const color = index % 2 === 0 ? tan : white
      box(scene, width - 0.08, 2.15, 2.4, cursor + width / 2, 1.08, -3.35, color)
      box(scene, width - 0.08, 0.18, 2.55, cursor + width / 2, 2.22, -3.35, roof)
      box(scene, 0.12, 2.0, 0.12, cursor + 0.18, 1.15, -2.05, 0x1a1a1a)
      cursor += width
    }

    const wingWidths = [1.8, 1.5, 1.4, 1.6, 2.2]
    let zCursor = -1.9
    for (const [index, depth] of wingWidths.entries()) {
      const color = index % 2 === 0 ? white : tan
      box(scene, 2.5, 2.15, depth - 0.08, 9.15, 1.08, zCursor + depth / 2, color)
      box(scene, 2.65, 0.18, depth - 0.08, 9.15, 2.22, zCursor + depth / 2, roof)
      box(scene, 0.12, 2.0, 0.12, 7.8, 1.15, zCursor + 0.3, 0x1a1a1a)
      zCursor += depth
    }

    const plan = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 3.1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
    )
    plan.rotation.x = -Math.PI / 2
    plan.position.set(-1.2, 0.08, 1.6)
    scene.add(plan)
    loader.load(OTB_FLOORPLAN_URL, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      plan.material.map = texture
      plan.material.needsUpdate = true
    })

    for (const [x, z] of [
      [-7.5, 4.2],
      [-3.2, 5.6],
      [2.4, 6.4],
      [5.8, 5.1],
      [-6.8, 7.8],
    ] as const) {
      const canopy = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x2f6b3a, roughness: 0.9 }),
      )
      canopy.position.set(x, 1.1, z)
      canopy.castShadow = true
      scene.add(canopy)
      box(scene, 0.14, 1.1, 0.14, x, 0.55, z, 0x5b4636)
    }

    const sign = box(scene, 2.6, 0.7, 0.12, -6.4, 1.55, 3.8, 0x1f3a5f)
    sign.rotation.y = 0.35

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
  }, [])

  return (
    <div className="relative min-h-80">
      <div ref={hostRef} className="min-h-80 w-full" />
      <p className="pointer-events-none absolute bottom-3 left-3 right-3 text-xs text-zinc-100/90">
        On The Boulevard · fixture strip · drag to look · scroll to zoom
      </p>
    </div>
  )
}
