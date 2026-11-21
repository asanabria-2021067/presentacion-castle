import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Sparkles, Line } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'

/* One camera "shot" per slide. The scene never cuts: GSAP dollies the camera
   and moves the book between shots, like a single continuous take. */
const SHOTS = [
  { cam: [0, 0.2, 7], look: [0, 0, 0], book: [2.75, -0.1, -0.6], rot: [0.12, -0.5, 0.06], open: 0, city: 0.25 },
  { cam: [-0.8, 0.5, 6.4], look: [-0.4, 0, 0], book: [-2.3, 0.1, 0.4], rot: [0.08, 0.85, -0.04], open: 0, city: 0.25 },
  { cam: [0, 6.5, 7.5], look: [0, -2.5, -5], book: [6, 4.2, -2], rot: [0.6, -0.9, 0.2], open: 0, city: 1 },
  { cam: [0.3, 0.4, 6], look: [0.3, 0, 0], book: [3.1, -0.2, -0.8], rot: [0.32, -0.4, 0], open: 1, city: 0.25 },
  { cam: [0, 0.3, 9.5], look: [0, 0, -2], book: [0, 4.2, -9], rot: [0.2, 0.7, 0.1], open: 0.35, city: 0.4 },
  { cam: [1.2, -0.2, 9.5], look: [0.6, 0, -2], book: [-2.6, 0.2, -6], rot: [0.1, -0.6, -0.1], open: 0.35, city: 0.4 },
  { cam: [0, 0, 6.2], look: [0, 0, 0], book: [0, -2.35, -0.6], rot: [-1.15, 0, 0.35], open: 0, city: 0.25 },
]

const INK = '#0b0b0d'

function makeCanvas(w, h, draw) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function useBookTextures() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    Promise.all([
      document.fonts.load('900 100px "Playfair Display"'),
      document.fonts.load('500 20px "IBM Plex Mono"'),
    ]).finally(() => setReady(true))
  }, [])

  return useMemo(() => {
    if (!ready) return null
    const cover = makeCanvas(600, 820, (g, w, h) => {
      const grd = g.createLinearGradient(0, 0, w, h)
      grd.addColorStop(0, '#6d1017')
      grd.addColorStop(1, '#250406')
      g.fillStyle = grd
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#c9a45c'
      g.lineWidth = 3
      g.strokeRect(28, 28, w - 56, h - 56)
      g.lineWidth = 1
      g.strokeRect(40, 40, w - 80, h - 80)
      g.fillStyle = '#c9a45c'
      g.textAlign = 'center'
      g.font = '500 22px "IBM Plex Mono"'
      g.fillText('R I C H A R D   C A S T L E', w / 2, 110)
      g.fillStyle = '#efe7d8'
      g.font = '900 128px "Playfair Display"'
      g.fillText('THE', w / 2, 330)
      g.fillText('CASE', w / 2, 460)
      g.fillText('FILE', w / 2, 590)
      g.fillStyle = '#c9a45c'
      g.font = '500 18px "IBM Plex Mono"'
      g.fillText('#1 NEW YORK BESTSELLER', w / 2, 690)
      // little skyline
      g.fillStyle = '#c9a45c'
      let x = 80
      while (x < w - 80) {
        const bw = 14 + Math.random() * 22
        const bh = 14 + Math.random() * 46
        g.fillRect(x, 760 - bh, bw, bh)
        x += bw + 3
      }
    })
    const spine = makeCanvas(120, 820, (g, w, h) => {
      g.fillStyle = '#3a070b'
      g.fillRect(0, 0, w, h)
      g.save()
      g.translate(w / 2, h / 2)
      g.rotate(Math.PI / 2)
      g.fillStyle = '#c9a45c'
      g.textAlign = 'center'
      g.font = '500 22px "IBM Plex Mono"'
      g.fillText('RICHARD CASTLE  ·  THE CASE FILE', 0, 8)
      g.restore()
    })
    const page = makeCanvas(600, 820, (g, w, h) => {
      g.fillStyle = '#efe7d8'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#1a1a1a'
      g.textAlign = 'left'
      g.font = '700 italic 46px "Playfair Display"'
      g.fillText('Chapter One', 70, 150)
      g.font = '400 19px "IBM Plex Mono"'
      const lines = [
        'The body was found at 6:14 a.m.,',
        'exactly like page 212 of my last',
        'novel. Detective Beckett did not',
        'look happy to see me.',
        '',
        '"You write about murder, Castle.',
        ' I solve them."',
      ]
      lines.forEach((l, i) => g.fillText(l, 70, 230 + i * 36))
      g.fillStyle = 'rgba(0,0,0,0.12)'
      for (let i = 0; i < 9; i++) g.fillRect(70, 520 + i * 30, 380 + Math.random() * 80, 10)
    })
    return { cover, spine, page }
  }, [ready])
}

function Book({ index, factor }) {
  const group = useRef()
  const pivot = useRef()
  const tex = useBookTextures()

  useEffect(() => {
    const s = SHOTS[index]
    const g = group.current
    if (!g) return
    gsap.to(g.position, { x: s.book[0] * factor, y: s.book[1] - (factor < 0.7 && index === 0 ? 1.3 : 0), z: s.book[2], duration: 1.6, ease: 'power3.inOut' })
    gsap.to(g.rotation, { x: s.rot[0], y: s.rot[1], z: s.rot[2], duration: 1.6, ease: 'power3.inOut' })
    if (pivot.current) gsap.to(pivot.current.rotation, { y: -s.open * 2.6, duration: 1.4, delay: 0.2, ease: 'power2.inOut' })
  }, [index, factor, tex])

  const coverMats = useMemo(() => {
    const plain = new THREE.MeshStandardMaterial({ color: '#4a090e', roughness: 0.55 })
    const front = tex ? new THREE.MeshStandardMaterial({ map: tex.cover, roughness: 0.5 }) : plain
    const inside = new THREE.MeshStandardMaterial({ color: '#e6dccb', roughness: 0.9 })
    return [plain, plain, plain, plain, front, inside]
  }, [tex])

  const pagesMats = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: '#e2d7c3', roughness: 0.95 })
    const top = tex ? new THREE.MeshStandardMaterial({ map: tex.page, roughness: 0.9 }) : edge
    return [edge, edge, edge, edge, top, edge]
  }, [tex])

  const spineMats = useMemo(() => {
    const plain = new THREE.MeshStandardMaterial({ color: '#3a070b', roughness: 0.55 })
    const s = tex ? new THREE.MeshStandardMaterial({ map: tex.spine, roughness: 0.5 }) : plain
    return [plain, s, plain, plain, plain, plain]
  }, [tex])

  // Book: 2.2 wide, 3 tall. Spine on the left (x = -1.1).
  return (
    <group ref={group} position={[SHOTS[0].book[0] * factor, 0, 0]} rotation={SHOTS[0].rot}>
      <Float speed={1.4} rotationIntensity={0.25} floatIntensity={0.5}>
        <mesh position={[0, 0, -0.24]} material={coverMats[0]}>
          <boxGeometry args={[2.2, 3, 0.05]} />
        </mesh>
        <mesh position={[0.02, 0, 0]} material={pagesMats}>
          <boxGeometry args={[2.1, 2.9, 0.42]} />
        </mesh>
        <mesh position={[-1.12, 0, 0]} material={spineMats}>
          <boxGeometry args={[0.06, 3, 0.53]} />
        </mesh>
        <group ref={pivot} position={[-1.1, 0, 0.24]}>
          <mesh position={[1.1, 0, 0]} material={coverMats}>
            <boxGeometry args={[2.2, 3, 0.05]} />
          </mesh>
        </group>
      </Float>
    </group>
  )
}

function City({ index }) {
  const mesh = useRef()
  const glow = useRef({ v: SHOTS[0].city })
  const winMat = useRef()
  const sirenR = useRef()
  const sirenB = useRef()

  const { buildings, windows } = useMemo(() => {
    const b = []
    const w = []
    for (let gx = -12; gx <= 12; gx += 1.3) {
      for (let gz = -20; gz <= -3; gz += 1.3) {
        if (Math.abs(gx) < 1.2) continue // the avenue
        const h = 0.6 + Math.pow(Math.random(), 2) * (gz < -12 ? 6 : 3.5)
        const sx = 0.7 + Math.random() * 0.35
        const sz = 0.7 + Math.random() * 0.35
        b.push({ x: gx, z: gz, h, sx, sz })
        const n = Math.floor(h * 6)
        for (let k = 0; k < n; k++) {
          if (Math.random() < 0.45) continue
          const face = Math.random() < 0.5
          w.push(
            gx + (face ? (Math.random() - 0.5) * sx * 0.8 : sx / 2 + 0.01),
            -3 + 0.15 + Math.random() * (h - 0.3),
            gz + (face ? sz / 2 + 0.01 : (Math.random() - 0.5) * sz * 0.8),
          )
        }
      }
    }
    return { buildings: b, windows: new Float32Array(w) }
  }, [])

  useEffect(() => {
    const m = mesh.current
    const tmp = new THREE.Object3D()
    buildings.forEach((b, i) => {
      tmp.position.set(b.x, -3 + b.h / 2, b.z)
      tmp.scale.set(b.sx, b.h, b.sz)
      tmp.updateMatrix()
      m.setMatrixAt(i, tmp.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }, [buildings])

  useEffect(() => {
    gsap.to(glow.current, { v: SHOTS[index].city, duration: 1.4, ease: 'power2.inOut' })
  }, [index])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const v = glow.current.v
    if (winMat.current) winMat.current.opacity = 0.25 + v * 0.75
    const on = v > 0.6 ? 1 : 0
    if (sirenR.current) sirenR.current.intensity = on * (Math.sin(t * 9) > 0 ? 14 : 0)
    if (sirenB.current) sirenB.current.intensity = on * (Math.sin(t * 9) <= 0 ? 14 : 0)
  })

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, buildings.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#1d1d26" emissive="#0d1020" roughness={0.8} metalness={0.2} />
      </instancedMesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[windows, 3]} />
        </bufferGeometry>
        <pointsMaterial ref={winMat} color="#ffcf7a" size={0.13} sizeAttenuation transparent opacity={0.4} />
      </points>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.01, -11]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#0e0e11" roughness={1} />
      </mesh>
      <pointLight ref={sirenR} position={[-0.4, -2.4, -6]} color="#ff2a2a" distance={9} intensity={0} />
      <pointLight ref={sirenB} position={[0.4, -2.4, -6]} color="#2a5bff" distance={9} intensity={0} />
    </group>
  )
}

function Evidence() {
  // Manila folders and photos drifting around the book, tied with red string.
  const items = useMemo(
    () => [
      { p: [-4.2, 1.8, -2.5], r: [0.3, 0.5, 0.2], kind: 'folder' },
      { p: [-3.4, -2, -1.5], r: [-0.2, 0.4, -0.3], kind: 'photo' },
      { p: [4.6, 2.3, -3], r: [0.2, -0.6, 0.1], kind: 'photo' },
      { p: [5, -1.8, -2.2], r: [-0.3, -0.4, 0.25], kind: 'folder' },
      { p: [0.6, 3, -4], r: [0.5, 0.1, -0.2], kind: 'photo' },
      { p: [-1.2, -3, -3.5], r: [-0.5, 0.2, 0.3], kind: 'folder' },
    ],
    [],
  )
  return (
    <group>
      {items.map((it, i) => (
        <Float key={i} speed={1 + i * 0.15} rotationIntensity={0.6} floatIntensity={1.2}>
          <group position={it.p} rotation={it.r}>
            {it.kind === 'folder' ? (
              <mesh>
                <boxGeometry args={[1.5, 1.1, 0.03]} />
                <meshStandardMaterial color="#c8a86a" roughness={0.9} />
              </mesh>
            ) : (
              <group>
                <mesh>
                  <boxGeometry args={[0.9, 1.05, 0.015]} />
                  <meshStandardMaterial color="#f1ece2" roughness={0.8} />
                </mesh>
                <mesh position={[0, 0.08, 0.009]}>
                  <planeGeometry args={[0.76, 0.72]} />
                  <meshStandardMaterial color="#26262c" roughness={0.4} />
                </mesh>
              </group>
            )}
          </group>
        </Float>
      ))}
      <Line points={[items[0].p, [0, 0.4, -1], items[2].p]} color="#b3121f" lineWidth={1.2} transparent opacity={0.6} />
      <Line points={[items[1].p, [0.3, -0.6, -1.5], items[3].p]} color="#b3121f" lineWidth={1.2} transparent opacity={0.6} />
    </group>
  )
}

function CameraRig({ index, factor }) {
  const { camera, pointer } = useThree()
  const rig = useRef({ x: 0, y: 0.2, z: 7, lx: 0, ly: 0, lz: 0 })
  const look = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const s = SHOTS[index]
    gsap.to(rig.current, {
      x: s.cam[0] * factor,
      y: s.cam[1],
      z: s.cam[2] + (1 - factor) * 4,
      lx: s.look[0] * factor,
      ly: s.look[1],
      lz: s.look[2],
      duration: 1.8,
      ease: 'power3.inOut',
    })
  }, [index, factor])

  useFrame((_, delta) => {
    const r = rig.current
    const k = 1 - Math.pow(0.001, delta)
    camera.position.x += (r.x + pointer.x * 0.35 - camera.position.x) * k
    camera.position.y += (r.y + pointer.y * 0.2 - camera.position.y) * k
    camera.position.z += (r.z - camera.position.z) * k
    look.set(r.lx, r.ly, r.lz)
    camera.lookAt(look)
  })
  return null
}

function Rig({ index }) {
  const { size } = useThree()
  const factor = Math.min(1, Math.max(0.45, size.width / size.height / 1.6))
  return (
    <>
      <CameraRig index={index} factor={factor} />
      <Book index={index} factor={factor} />
    </>
  )
}

export default function Scene({ index }) {
  return (
    <Canvas
      className="scene"
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 7], fov: 40, near: 0.1, far: 80 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => gl.setClearColor(INK)}
    >
      <fog attach="fog" args={[INK, 9, 30]} />
      <ambientLight intensity={0.35} />
      <hemisphereLight args={["#3a4a7a", "#0b0b0d", 0.6]} />
      <spotLight position={[-4, 6, 6]} angle={0.5} penumbra={0.8} intensity={60} color="#ffd9a0" />
      <directionalLight position={[5, 2, -4]} intensity={1.2} color="#6f8cff" />
      <pointLight position={[3, -2, 4]} intensity={6} color="#b3121f" distance={12} />
      <Rig index={index} />
      <Evidence />
      <City index={index} />
      <Sparkles count={90} scale={[16, 9, 10]} size={1.6} speed={0.25} color="#ffdca8" opacity={0.5} />
    </Canvas>
  )
}
