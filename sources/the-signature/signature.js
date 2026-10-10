import * as THREE from 'three'

const canvas = document.querySelector('#signature-field')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const isMobile = () => window.matchMedia('(max-width: 760px)').matches
const pointer = { x: 0, y: 0, targetX: 0, targetY: 0 }

function seededRandom(seed = 0x51A7) {
    let state = seed >>> 0
    return () => {
        state ^= state << 13; state ^= state >>> 17; state ^= state << 5
        return (state >>> 0) / 4294967296
    }
}
const random = seededRandom()
const scene = new THREE.Scene()
scene.background = new THREE.Color('#030304')
const camera = new THREE.PerspectiveCamera(43, innerWidth / innerHeight, 0.1, 100)
camera.position.set(0, 0, 10.3)
camera.lookAt(0, 0, 0)
let renderer, ribbon, animationFrame = 0

function createRibbon() {
    const count = isMobile() ? 32000 : 104000
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const majorRadius = 2.8, halfWidth = 1.78
    for (let i = 0; i < count; i++) {
        const u = random() * Math.PI * 2
        const v = (random() * 2 - 1) * halfWidth
        const cross = v * (0.96 + 0.05 * Math.sin(3 * u + v * 1.6))
        const wrinkle = 0.19 * Math.sin(3 * u + v * 2.3) + 0.11 * Math.sin(7 * u - v * 1.4)
        const radius = majorRadius + cross * Math.cos(u * 0.5) + wrinkle
        const jitter = (random() - 0.5) * 0.085
        const k = i * 3
        positions[k] = radius * Math.cos(u) + jitter * Math.cos(u + 0.4)
        positions[k + 1] = (radius * Math.sin(u) + jitter * Math.sin(u)) * 0.82
        positions[k + 2] = cross * Math.sin(u * 0.5) + 0.22 * Math.sin(3 * u + v) + (random() - 0.5) * 0.12
        const shade = 0.18 + Math.pow(random(), 1.65) * 0.8
        colors[k] = shade * 0.79
        colors[k + 1] = shade * 0.83
        colors[k + 2] = shade * (0.92 + random() * 0.08)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.computeBoundingSphere()
    const material = new THREE.PointsMaterial({
        size: isMobile() ? 0.022 : 0.019, vertexColors: true, transparent: true,
        opacity: 0.93, sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
    })
    const points = new THREE.Points(geometry, material)
    points.rotation.set(0.62, 0.13, -0.2)
    points.position.set(isMobile() ? 0 : -0.25, 0.02, 0)
    points.scale.setScalar(isMobile() ? 0.88 : 1)
    scene.add(points)
    return points
}
function createDust() {
    const count = isMobile() ? 700 : 2200
    const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
        const k = i * 3
        positions[k] = (random() - 0.5) * 25
        positions[k + 1] = (random() - 0.5) * 15
        positions[k + 2] = -3 - random() * 14
        const shade = 0.16 + random() * 0.18
        colors[k] = shade * 0.76; colors[k + 1] = shade * 0.82; colors[k + 2] = shade
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({
        size: 0.014, vertexColors: true, transparent: true, opacity: 0.38, sizeAttenuation: true, depthWrite: false
    })))
}
function fallback() {
    document.documentElement.classList.add('field-fallback')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const count = isMobile() ? 10000 : 24000, dots = [], rnd = seededRandom(0x515151)
    const resize = () => {
        const ratio = Math.min(devicePixelRatio || 1, 1.5)
        canvas.width = Math.floor(innerWidth * ratio); canvas.height = Math.floor(innerHeight * ratio)
        canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px'
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    resize()
    for (let i = 0; i < count; i++) {
        const u = rnd() * Math.PI * 2, v = (rnd() * 2 - 1) * 1.7
        const r = 0.38 + 0.14 * Math.sin(3 * u)
        dots.push({ x: 0.5 + r * Math.cos(u) * 0.105 + v * Math.cos(u / 2) * Math.cos(u) * 0.035,
            y: 0.5 + r * Math.sin(u) * 0.19, a: 0.16 + rnd() * 0.78, s: rnd() < 0.94 ? 0.55 : 1.25 })
    }
    const draw = () => {
        ctx.clearRect(0, 0, innerWidth, innerHeight)
        for (const dot of dots) { ctx.fillStyle = 'rgba(210,216,245,' + dot.a + ')'; ctx.fillRect(dot.x * innerWidth, dot.y * innerHeight, dot.s, dot.s) }
    }
    addEventListener('resize', () => { resize(); draw() }, { passive: true })
    draw()
}

try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5))
    renderer.setSize(innerWidth, innerHeight, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor('#030304', 1)
    ribbon = createRibbon()
    createDust()
    const resize = () => {
        const mobile = isMobile()
        camera.aspect = innerWidth / innerHeight
        camera.position.z = mobile ? 12.4 : 10.3
        camera.fov = mobile ? 47 : 43
        camera.updateProjectionMatrix()
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5))
        renderer.setSize(innerWidth, innerHeight, false)
        ribbon.scale.setScalar(mobile ? 0.88 : 1)
        ribbon.position.x = mobile ? 0 : -0.25
    }
    addEventListener('resize', resize, { passive: true })
    addEventListener('pointermove', event => {
        if (reduceMotion) return
        pointer.targetX = (event.clientX / innerWidth - 0.5) * 2
        pointer.targetY = (event.clientY / innerHeight - 0.5) * 2
    }, { passive: true })
    const clock = new THREE.Clock()
    const render = () => {
        const t = clock.getElapsedTime()
        if (!reduceMotion) {
            pointer.x += (pointer.targetX - pointer.x) * 0.025
            pointer.y += (pointer.targetY - pointer.y) * 0.025
            ribbon.rotation.y = 0.13 + pointer.x * 0.12 + Math.sin(t * 0.12) * 0.035
            ribbon.rotation.x = 0.62 + pointer.y * 0.09 + Math.cos(t * 0.09) * 0.018
            ribbon.rotation.z = -0.2 + Math.sin(t * 0.075) * 0.025
        }
        renderer.render(scene, camera)
        animationFrame = requestAnimationFrame(render)
    }
    render()
} catch (error) {
    console.warn('The Signature WebGL field could not start; using the static fallback.', error)
    if (renderer) renderer.dispose()
    fallback()
}
addEventListener('pagehide', () => {
    if (animationFrame) cancelAnimationFrame(animationFrame)
    if (renderer) renderer.dispose()
}, { once: true })
