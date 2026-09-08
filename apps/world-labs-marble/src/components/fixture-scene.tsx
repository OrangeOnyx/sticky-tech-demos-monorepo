import { useEffect, useRef } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { OTB_PANO_URL, OTB_THUMBNAIL_URL } from "@shared/otb"

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
    scene.background = new THREE.Color(0x6d7c88)
    scene.fog = new THREE.Fog(0x6d7c88, 18, 55)

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

    scene.add(new THREE.HemisphereLight(0xfff1e0, 0x4a5a3a, 1.05))
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
      color: 0xa8d4d8,
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

    const stucco = 0xe8dcc8
    const stuccoAlt = 0xf4eee4
    const clay = 0x5c4033
    const glass = 0x7aa8c9
    const unitWidths = [2.4, 1.2, 1.1, 1.4, 1.2, 1.3, 1.1, 1.5, 1.2, 1.1, 1.3, 1.2, 1.4, 1.1, 1.6]
    let cursor = -8.6
    for (const [index, width] of unitWidths.entries()) {
      const color = index % 2 === 0 ? stucco : stuccoAlt
      box(scene, width - 0.08, 2.15, 2.4, cursor + width / 2, 1.08, -3.35, color)
      box(scene, width - 0.08, 0.22, 2.7, cursor + width / 2, 2.24, -3.35, clay)
      box(scene, width - 0.28, 0.95, 0.08, cursor + width / 2, 0.95, -2.12, glass, {
        roughness: 0.2,
        metalness: 0.15,
      })
      box(scene, 0.18, 2.05, 0.18, cursor + 0.18, 1.15, -2.05, 0xf4f1ea)
      cursor += width
    }

    const wingWidths = [1.8, 1.5, 1.4, 1.6, 2.2]
    let zCursor = -1.9
    for (const [index, depth] of wingWidths.entries()) {
      const color = index % 2 === 0 ? stuccoAlt : stucco
      box(scene, 2.5, 2.15, depth - 0.08, 9.15, 1.08, zCursor + depth / 2, color)
      box(scene, 2.75, 0.22, depth - 0.08, 9.15, 2.24, zCursor + depth / 2, clay)
      box(scene, 0.08, 0.95, depth - 0.28, 7.88, 0.95, zCursor + depth / 2, glass, {
        roughness: 0.2,
        metalness: 0.15,
      })
      box(scene, 0.18, 2.05, 0.18, 7.8, 1.15, zCursor + 0.3, 0xf4f1ea)
      zCursor += depth
    }

    const tower = box(scene, 1.4, 3.2, 1.4, 9.15, 1.7, 8.4, stucco)
    tower.castShadow = true
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(1.05, 1.15, 10),
      new THREE.MeshStandardMaterial({ color: clay, roughness: 0.7 }),
    )
    cone.position.set(9.15, 3.85, 8.4)
    cone.castShadow = true
    scene.add(cone)

    const plan = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 3.1),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 }),
    )
    plan.rotation.x = -Math.PI / 2
    plan.position.set(-1.2, 0.08, 1.6)
    scene.add(plan)
    loader.load(OTB_PANO_URL, (texture) => {
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
      box(scene, 0.16, 2.4, 0.16, x, 1.2, z, 0x6b4a2a)
      const frond = new THREE.Mesh(
        new THREE.SphereGeometry(0.85, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x2f7a3e, roughness: 0.9 }),
      )
      frond.position.set(x, 2.55, z)
      frond.scale.set(1, 0.55, 1)
      frond.castShadow = true
      scene.add(frond)
    }

    for (const [x, z] of [
      [-5.2, 2.4],
      [-0.4, 3.6],
      [3.8, 2.8],
      [6.2, 0.4],
    ] as const) {
      box(scene, 0.08, 1.7, 0.08, x, 0.85, z, 0x1a1a1a)
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 8, 8),
        new THREE.MeshStandardMaterial({
          color: 0xfff3c4,
          emissive: 0xffe08a,
          emissiveIntensity: 0.6,
        }),
      )
      lamp.position.set(x, 1.78, z)
      scene.add(lamp)
    }

    const sign = box(scene, 2.6, 0.7, 0.12, -6.4, 1.55, 3.8, 0xc9a227)
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
        On The Boulevard · Nov 2020 photos · cream fascia / brown shingles · drag to look
      </p>
    </div>
  )
}
