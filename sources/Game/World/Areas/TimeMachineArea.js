import * as THREE from 'three/webgpu'
import { InteractivePoints } from '../../InteractivePoints.js'
import { Area } from './Area.js'
import gsap from 'gsap'

export class TimeMachineArea extends Area
{
    constructor(model)
    {
        super(model)

        this.setInteractivePoint()
        this.setTV()
        this.setAchievement()
    }

    setInteractivePoint()
    {
        this.interactivePoint = this.game.interactivePoints.create(
            this.references.items.get('interactivePoint')[0].position,
            'Archive',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                window.open('https://bysho.ai', '_blank')
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

    setTV()
    {
        const screenMesh = this.references.items.get('screen')[0]
        screenMesh.material = new THREE.MeshBasicNodeMaterial({ color: 0x111111 })

    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'archive')
        })
    }
}