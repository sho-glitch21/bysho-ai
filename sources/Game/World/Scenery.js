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

        // Set SUL before objects are added so their visual and physics transforms start together.
        this.setSulBridgeDoor(model)
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

        this.setRoad()

        this.game.ticker.events.on('tick', () =>
        {
            this.update()
        })
    }
    
    setSulBridgeDoor(model)
    {
        // SUL is part of the scenery GLB, but its exported Blender nodes are
        // named Cube.* rather than "SUL". These are the 13 separate letter
        // pieces at the original river-side position.
        const sulNodeNames = new Set([
            'Cube.001',
            'Cube.049',
            'Cube.059',
            'Cube.064',
            'Cube.066',
            'Cube.067',
            'Cube.071',
            'Cube.072',
            'Cube.074',
            'Cube.075',
            'Cube.076',
            'Cube.078',
            'Cube.079'
        ])

        const sulPieces = model.filter((object) => sulNodeNames.has(object.name))
        if(sulPieces.length !== sulNodeNames.size)
        {
            console.warn('[BYSHO] SUL placement skipped: expected 13 named scenery pieces, found', sulPieces.length)
            return
        }

        // Keep each piece's Y coordinate and its independent object/collision setup.
        // Only move the existing letter pieces horizontally to the landing car spawn.
        const spawn = this.game.respawns.getDefault()
        if(!spawn)
        {
            console.warn('[BYSHO] SUL placement skipped: default car spawn is unavailable')
            return
        }

        for(const piece of sulPieces)
        {
            piece.position.x = spawn.position.x
            piece.position.z = spawn.position.z
        }

        console.info('[BYSHO] Positioned all 13 SUL scenery pieces at car spawn', {
            x: spawn.position.x,
            z: spawn.position.z,
            pieces: sulPieces.map((piece) => piece.name)
        })
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
