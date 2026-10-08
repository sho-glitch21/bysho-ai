import * as THREE from 'three/webgpu'
import { color, float, Fn, max, PI, positionWorld, texture, uniform, uv, vec3 } from 'three/tsl'
import { Game } from '../Game.js'
import { References } from '../References.js'
import { MeshDefaultMaterial } from '../Materials/MeshDefaultMaterial.js'

export class Scenery
{
    constructor()
    {
        this.game = Game.getInstance()

        this.references = new References()
        const model = [...this.game.resources.sceneryModel.scene.children]
        for(const child of model)
        {
            // Add
            if(typeof child.userData.prevent === 'undefined' || child.userData.prevent === false)
            {
                // Objects
                this.game.objects.addFromModel(
                    child,
                    {

                    },
                    {
                        position: child.position,
                        rotation: child.quaternion,
                        sleeping: true,
                        mass: child.userData.mass
                    }
                )
            }

            this.references.parse(child)
        }

        this.setSulBridgeDoor(model)

        this.setRoad()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }
    
    setSulBridgeDoor(model)
    {
        const findByName = (object, pattern) =>
        {
            if(pattern.test(object.name || ''))
                return object

            for(const child of object.children || [])
            {
                const found = findByName(child, pattern)
                if(found)
                    return found
            }

            return null
        }

        const sul = model.map((object) => findByName(object, /sul/i)).find(Boolean)
        const bridge = model.map((object) => findByName(object, /bridge/i)).find(Boolean)

        if(!sul || !bridge)
            return

        const bridgeBounds = new THREE.Box3().setFromObject(bridge)
        const bridgeSize = bridgeBounds.getSize(new THREE.Vector3())
        const bridgeCenter = bridgeBounds.getCenter(new THREE.Vector3())
        const sulPosition = sul.getWorldPosition(new THREE.Vector3())

        // Put SUL at the bridge exit closest to its current location.
        // This turns it into a deliberate gate/block on the driving path.
        const alongX = bridgeSize.x >= bridgeSize.z
        const endpointA = bridgeCenter.clone()
        const endpointB = bridgeCenter.clone()

        if(alongX)
        {
            endpointA.x = bridgeBounds.min.x
            endpointB.x = bridgeBounds.max.x
        }
        else
        {
            endpointA.z = bridgeBounds.min.z
            endpointB.z = bridgeBounds.max.z
        }

        const endpoint = sulPosition.distanceTo(endpointA) <= sulPosition.distanceTo(endpointB) ? endpointA : endpointB
        const localEndpoint = sul.parent ? sul.parent.worldToLocal(endpoint.clone()) : endpoint
        sul.position.x = localEndpoint.x
        sul.position.z = localEndpoint.z

        if(this.game.debug.active)
            console.log('[BYSHO] SUL bridge door positioned at', endpoint)
    }

    setRoad()
    {
        this.road = {}

        // Mesh and material
        const mesh = this.references.items.get('road')[0]
        
        this.road.color = uniform(color('#383039'))
        this.road.glitterVariation = uniform(0)
        this.road.glitterScarcity = uniform(100)
        this.road.glitterIntensity = uniform(0.3)
        this.road.glitterPerlinFrequency = uniform(0.05)
        this.road.glitterHashFrequency = uniform(0.2)

        const colorNode = Fn(() =>
        {
            const glitter = float(0)

            // Hash
            const hashUv = positionWorld.xz.mul(this.road.glitterHashFrequency)
            const hash = texture(this.game.noises.hash, hashUv).r.mul(2).add(this.road.glitterVariation).mod(2).sub(1).abs()
            glitter.addAssign(hash)

            // Scarcity
            glitter.assign(glitter.pow(this.road.glitterScarcity))

            // Intensity
            glitter.mulAssign(this.road.glitterIntensity)
            
            const perlinUv = positionWorld.xz.mul(this.road.glitterPerlinFrequency)
            const perlin = texture(this.game.noises.perlin, perlinUv).r
            glitter.mulAssign(perlin)

            const middle = uv().y.mul(PI).sin()
            glitter.mulAssign(middle)
            
            // Output
            const baseColor = this.road.color.toVar()
            baseColor.addAssign(glitter)

            return vec3(baseColor)
        })()

        const material = new MeshDefaultMaterial({
            colorNode: colorNode,

            hasLightBounce: false,
            hasWater: false,
        })
        mesh.material = material

        // // Physics
        // this.road.body = mesh.userData.object.physical.body
        // this.road.body.setEnabled(false)

        // Debug
        if(this.game.debug.active)
        {
            const debugPanel = this.game.debug.panel.addFolder({
                title: '🛣️ Road',
                expanded: false
            })
            this.game.debug.addThreeColorBinding(debugPanel, this.road.color.value, 'color')
            debugPanel.addBinding(this.road.glitterScarcity, 'value', { label: 'glitterScarcity', min: 100, max: 10000, step: 1 })
            debugPanel.addBinding(this.road.glitterIntensity, 'value', { label: 'glitterIntensity', min: 0, max: 10, step: 0.01 })
            debugPanel.addBinding(this.road.glitterPerlinFrequency, 'value', { label: 'glitterPerlinFrequency', min: 0, max: 0.1, step: 0.0001 })
            debugPanel.addBinding(this.road.glitterHashFrequency, 'value', { label: 'glitterHashFrequency', min: 0, max: 1, step: 0.0001 })
        }
    }

    update()
    {
        this.road.glitterVariation.value += this.game.ticker.deltaScaled * 0.004 + this.game.view.delta.length() * 0.004
    }
}