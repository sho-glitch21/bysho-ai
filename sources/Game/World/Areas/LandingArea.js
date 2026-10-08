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

        // Start from the original landing-letter objects and their colliders.
        // We keep their footprint/orientation as our reference, but rebuild the
        // visible lettering as separate physical characters.
        const bounds = new THREE.Box3()
        let sourceMaterial = null

        for(const reference of references)
        {
            bounds.expandByObject(reference)

            const object = reference.userData.object
            if(!object)
                continue

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

        const center = bounds.getCenter(new THREE.Vector3())
        const targetSize = bounds.getSize(new THREE.Vector3())
        const orientation = references[0].getWorldQuaternion(new THREE.Quaternion())

        const loader = new TTFLoader()
        loader.load(
            './fonts/Pally-Medium.ttf',
            (fontData) =>
            {
                const font = new Font(fontData)

                const makeMaterial = () =>
                    sourceMaterial?.clone?.() || new THREE.MeshStandardNodeMaterial({
                        color: 0xf4a6a6,
                        roughness: 0.7
                    })

                const createLetterRow = (text, rowCenter, rowWidth, rowHeight, prefix) =>
                {
                    const characters = [...text]
                    const geometries = []
                    const widths = []
                    let maxHeight = 0

                    for(const character of characters)
                    {
                        if(character === ' ')
                        {
                            geometries.push(null)
                            widths.push(0)
                            continue
                        }

                        const geometry = new TextGeometry(character,
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
                        const size = geometry.boundingBox.getSize(new THREE.Vector3())

                        geometries.push(geometry)
                        widths.push(size.x)
                        maxHeight = Math.max(maxHeight, size.y)
                    }

                    const letterGap = maxHeight * 0.07
                    const spaceWidth = maxHeight * 0.42

                    let totalWidth = 0
                    for(let i = 0; i < characters.length; i++)
                    {
                        const advance = characters[i] === ' ' ? spaceWidth : widths[i]
                        totalWidth += advance
                        if(i < characters.length - 1)
                            totalWidth += letterGap
                    }

                    const scale = Math.min(
                        rowWidth / Math.max(totalWidth, 0.001),
                        rowHeight / Math.max(maxHeight, 0.001)
                    )

                    let cursor = - totalWidth * 0.5

                    for(let i = 0; i < characters.length; i++)
                    {
                        const character = characters[i]
                        const advance = character === ' ' ? spaceWidth : widths[i]

                        if(character !== ' ')
                        {
                            const geometry = geometries[i]
                            geometry.center()

                            const mesh = new THREE.Mesh(geometry, makeMaterial())
                            mesh.scale.setScalar(scale)
                            mesh.quaternion.copy(orientation)
                            mesh.name = \`\${prefix}-\${i}-\${character}\`
                            mesh.userData.byshoLetter = prefix

                            const localPosition = new THREE.Vector3(
                                cursor + advance * 0.5,
                                0,
                                0
                            )

                            const worldPosition = localPosition.applyQuaternion(orientation).add(rowCenter)

                            mesh.position.copy(worldPosition)

                            const depth = 0.22 * scale
                            const colliderHalfWidth = Math.max(widths[i] * scale * 0.5, 0.04)
                            const colliderHalfHeight = Math.max(maxHeight * scale * 0.5, 0.08)
                            const colliderHalfDepth = Math.max(depth * 0.5, 0.05)

                            const letterObject = this.game.objects.add(
                                {
                                    model: mesh,
                                    parent: this.game.scene
                                },
                                {
                                    type: 'dynamic',
                                    position: worldPosition,
                                    rotation: orientation,
                                    sleeping: true,
                                    linearDamping: 0.25,
                                    angularDamping: 0.3,
                                    colliders: [
                                        {
                                            shape: 'cuboid',
                                            parameters: [
                                                colliderHalfWidth,
                                                colliderHalfHeight,
                                                colliderHalfDepth
                                            ],
                                            mass: 3,
                                            friction: 0.8,
                                            restitution: 0.05
                                        }
                                    ]
                                }
                            )

                            const collider = letterObject.physical.colliders[0]
                            collider.setActiveEvents(this.game.RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
                            collider.setContactForceEventThreshold(5)

                            letterObject.physical.onCollision = (force, position) =>
                            {
                                this.game.audio.groups.get('hitBrick').playRandomNext(force, position)
                            }

                            if(prefix === 'signature')
                                this.signature = this.signature || { letters: [] }

                            if(prefix === 'signature')
                                this.signature.letters.push(letterObject)
                            else
                                this.sulSignature = this.sulSignature || { letters: [] }

                            if(prefix !== 'signature')
                                this.sulSignature.letters.push(letterObject)
                        }

                        cursor += advance
                        if(i < characters.length - 1)
                            cursor += letterGap
                    }
                }

                // Main signature: individual movable letters, just like the
                // original landing implementation — but spelling SHOAIB RAHMAN.
                this.signature = { letters: [] }
                createLetterRow(
                    'SHOAIB RAHMAN',
                    center,
                    targetSize.x,
                    targetSize.y,
                    'signature'
                )

                // SUL is intentionally placed extremely close to the main sign.
                // Same letter height / visual scale, as requested.
                const sulCenter = center.clone()
                const sulLocalOffset = new THREE.Vector3(
                    targetSize.x * 0.34,
                    -targetSize.y * 0.86,
                    targetSize.z * 0.25 + 0.18
                )
                sulCenter.add(sulLocalOffset.applyQuaternion(orientation))

                this.sulSignature = { letters: [] }
                createLetterRow(
                    'SUL',
                    sulCenter,
                    targetSize.x * 0.24,
                    targetSize.y,
                    'sul'
                )
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