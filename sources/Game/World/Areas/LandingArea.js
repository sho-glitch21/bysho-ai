import * as THREE from 'three/webgpu'
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js'
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js'
import { Font } from 'three/addons/loaders/FontLoader.js'
import { color, float, Fn, instancedArray, mix, normalWorld, positionGeometry, step, texture, uniform, uv, vec2, vec3, vec4 } from 'three/tsl'
import { Inputs } from '../../Inputs/Inputs.js'
import { InteractivePoints } from '../../InteractivePoints.js'
import { Area } from './Area.js'
import gsap from 'gsap'
import { MeshDefaultMaterial } from '../../Materials/MeshDefaultMaterial.js'

export class LandingArea extends Area
{
    constructor(model)
    {
        super(model)

        this.localTime = uniform(0)

        this.setLetters()
        this.setKiosk()
        this.setControls()
        this.setBonfire()
        this.setAchievement()
    }

    setLetters()
    {
        const references = this.references.items.get('letters') || []

        if(references.length === 0)
            return

        // Keep the original landing lettering's physical objects as our
        // measurement reference, but replace their visible geometry.
        const bounds = new THREE.Box3()
        let sourceMaterial = null

        for(const reference of references)
        {
            bounds.expandByObject(reference)

            const object = reference.userData.object
            if(object)
            {
                if(object.physical)
                    object.physical.body.setEnabled(false)

                if(object.visual)
                {
                    if(!sourceMaterial)
                    {
                        object.visual.object3D.traverse((_child) =>
                        {
                            if(!sourceMaterial && _child.isMesh && _child.material)
                                sourceMaterial = Array.isArray(_child.material) ? _child.material[0] : _child.material
                        })
                    }

                    object.visual.object3D.removeFromParent()
                    this.objects.hideable = this.objects.hideable.filter(_object3D => _object3D !== object.visual.object3D)
                }
            }
        }

        const center = bounds.getCenter(new THREE.Vector3())
        const targetSize = bounds.getSize(new THREE.Vector3())
        const orientation = references[0].getWorldQuaternion(new THREE.Quaternion())

        const loader = new TTFLoader()
        loader.load(
            './fonts/Pally-Medium.ttf',
            (fontData) =>
            {
                const font = new Font(fontData)

                // Main signature — real 3D text, sized to the original landing
                // sign footprint.
                const geometry = new TextGeometry('SHOAIB RAHMAN',
                {
                    font,
                    size: 1,
                    depth: 0.22,
                    curveSegments: 8,
                    bevelEnabled: true,
                    bevelThickness: 0.04,
                    bevelSize: 0.025,
                    bevelSegments: 2
                })

                geometry.computeBoundingBox()
                const textSize = geometry.boundingBox.getSize(new THREE.Vector3())
                geometry.center()

                const material = sourceMaterial?.clone?.() || new THREE.MeshStandardNodeMaterial({
                    color: 0xf4a6a6,
                    roughness: 0.7
                })

                const widthScale = targetSize.x / Math.max(textSize.x, 0.001)
                const heightScale = targetSize.y / Math.max(textSize.y, 0.001)
                const scale = Math.min(widthScale, heightScale)

                const mesh = new THREE.Mesh(geometry, material)
                mesh.scale.setScalar(scale)
                mesh.position.copy(center)
                mesh.quaternion.copy(orientation)
                mesh.userData.byshoSignature = true

                // Give the whole signature its own dynamic rigid body.
                // This makes the visible text a proper physical object rather
                // than a floating/decal-like image: the car can hit it,
                // push it, rotate it and move it.
                const signatureObject = this.game.objects.add(
                    {
                        model: mesh,
                        parent: this.game.scene
                    },
                    {
                        type: 'dynamic',
                        position: center,
                        rotation: orientation,
                        sleeping: true,
                        linearDamping: 0.25,
                        angularDamping: 0.3,
                        colliders: [
                            {
                                shape: 'cuboid',
                                parameters: [
                                    Math.max(targetSize.x * 0.5, 0.05),
                                    Math.max(targetSize.y * 0.5, 0.05),
                                    Math.max(targetSize.z * 0.5 + 0.12, 0.12)
                                ],
                                mass: 25,
                                friction: 0.8,
                                restitution: 0.05
                            }
                        ]
                    }
                )

                this.signature = { object: signatureObject, mesh, geometry, material }

                // SUL — intentionally close to the signature, like someone
                // placed it there on purpose. Smaller, quieter, still real 3D.
                const sulGeometry = new TextGeometry('SUL',
                {
                    font,
                    size: 1,
                    depth: 0.22,
                    curveSegments: 8,
                    bevelEnabled: true,
                    bevelThickness: 0.04,
                    bevelSize: 0.025,
                    bevelSegments: 2
                })

                sulGeometry.center()

                const sulMaterial = material?.clone?.() || new THREE.MeshStandardNodeMaterial({
                    color: 0xf4a6a6,
                    roughness: 0.7
                })

                const sulMesh = new THREE.Mesh(sulGeometry, sulMaterial)
                sulMesh.scale.setScalar(scale * 0.36)

                // Place it just off the lower-right of SHOAIB RAHMAN.
                // The offset is expressed in the signature's local orientation.
                const sulOffset = new THREE.Vector3(
                    targetSize.x * 0.47,
                    -targetSize.y * 0.38,
                    0.16
                )
                sulOffset.applyQuaternion(orientation)

                sulMesh.position.copy(center).add(sulOffset)
                sulMesh.quaternion.copy(orientation)
                sulMesh.userData.byshoSUL = true

                this.game.scene.add(sulMesh)
                this.sulSignature = { mesh: sulMesh, geometry: sulGeometry, material: sulMaterial }
            },
            undefined,
            (error) =>
            {
                console.error('BYSHO landing signature font failed to load', error)
            }
        )
    }
    setKiosk()
    {
        // Interactive point
        const interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('kioskInteractivePoint')[0].position,
            'Map',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.modals.open('map')
                // interactivePoint.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )

        // this.game.map.items.get('map').events.on('close', () =>
        // {
        //     interactivePoint.show()
        // })
    }

    setControls()
    {
        // Interactive point
        const interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('controlsInteractivePoint')[0].position,
            'Controls',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.inputs.interactiveButtons.clearItems()
                this.game.menu.open('controls')
                interactivePoint.hide()
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )

        // Menu instance
        const menuInstance = this.game.menu.items.get('controls')

        menuInstance.events.on('close', () =>
        {
            interactivePoint.show()
        })

        menuInstance.events.on('open', () =>
        {
            if(this.game.inputs.mode === Inputs.MODE_GAMEPAD)
                menuInstance.tabs.goTo('gamepad')
            else if(this.game.inputs.mode === Inputs.MODE_MOUSEKEYBOARD)
                menuInstance.tabs.goTo('mouse-keyboard')
            else if(this.game.inputs.mode === Inputs.MODE_TOUCH)
                menuInstance.tabs.goTo('touch')
        })
    }

    setBonfire()
    {
        const position = this.references.items.get('bonfireHashes')[0].position

        // Particles
        let particles = null
        {
            const emissiveMaterial = this.game.materials.getFromName('emissiveOrangeRadialGradient')
    
            const count = 30
            const elevation = uniform(5)
            const positions = new Float32Array(count * 3)
            const scales = new Float32Array(count)
    
    
            for(let i = 0; i < count; i++)
            {
                const i3 = i * 3
    
                const angle = Math.PI * 2 * Math.random()
                const radius = Math.pow(Math.random(), 1.5) * 1
                positions[i3 + 0] = Math.cos(angle) * radius
                positions[i3 + 1] = Math.random()
                positions[i3 + 2] = Math.sin(angle) * radius
    
                scales[i] = 0.02 + Math.random() * 0.06
            }
            
            const positionAttribute = instancedArray(positions, 'vec3').toAttribute()
            const scaleAttribute = instancedArray(scales, 'float').toAttribute()
    
            const material = new THREE.SpriteNodeMaterial()
            material.outputNode = emissiveMaterial.outputNode
    
            const progress = float(0).toVar()
    
            material.positionNode = Fn(() =>
            {
                const newPosition = positionAttribute.toVar()
                progress.assign(newPosition.y.add(this.localTime.mul(newPosition.y)).fract())
    
                newPosition.y.assign(progress.mul(elevation))
                newPosition.xz.addAssign(this.game.wind.direction.mul(progress))
    
                const progressHide = step(0.8, progress).mul(100)
                newPosition.y.addAssign(progressHide)
                
                return newPosition
            })()
            material.scaleNode = Fn(() =>
            {
                const progressScale = progress.remapClamp(0.5, 1, 1, 0)
                return scaleAttribute.mul(progressScale)
            })()
    
            const geometry = new THREE.CircleGeometry(0.5, 8)
    
            particles = new THREE.Mesh(geometry, material)
            particles.visible = false
            particles.position.copy(position)
            particles.count = count
            this.game.scene.add(particles)
        }

        // Hashes
        {
            const alphaNode = Fn(() =>
            {
                const baseUv = uv(1)
                const distanceToCenter = baseUv.sub(0.5).length()
    
                const voronoi = texture(
                    this.game.noises.voronoi,
                    baseUv
                ).g
    
                voronoi.subAssign(distanceToCenter.remap(0, 0.5, 0.3, 0))
    
                return voronoi
            })()
    
            const material = new MeshDefaultMaterial({
                colorNode: color(0x6F6A87),
                alphaNode: alphaNode,
                hasWater: false,
                hasLightBounce: false
            })
    
            const mesh = this.references.items.get('bonfireHashes')[0]
            mesh.material = material
        }

        // Burn
        const burn = this.references.items.get('bonfireBurn')[0]
        burn.visible = false

        // Interactive point
        this.game.interactivePoints.create(
            this.references.items.get('bonfireInteractivePoint')[0].position,
            'Res(e)t',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                this.game.reset()

                gsap.delayedCall(2, () =>
                {
                    // Bonfire
                    particles.visible = true
                    burn.visible = true
                    this.game.ticker.wait(2, () =>
                    {
                        particles.geometry.boundingSphere.center.y = 2
                        particles.geometry.boundingSphere.radius = 2
                    })

                    // Sound
                    this.game.audio.groups.get('campfire').items[0].positions.push(position)
                })
            },
            () =>
            {
                this.game.inputs.interactiveButtons.addItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            },
            () =>
            {
                this.game.inputs.interactiveButtons.removeItems(['interact'])
            }
        )
    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'landing')
        })
        this.events.on('boundingOut', () =>
        {
            this.game.achievements.setProgress('landingLeave', 1)
        })
    }

    update()
    {
        this.localTime.value += this.game.ticker.deltaScaled * 0.1
    }
}