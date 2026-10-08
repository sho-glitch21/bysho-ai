import * as THREE from 'three/webgpu'
import { InteractivePoints } from '../../InteractivePoints.js'
import { Area } from './Area.js'

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
            'Show a joke',
            InteractivePoints.ALIGN_RIGHT,
            InteractivePoints.STATE_CONCEALED,
            () =>
            {
                const jokes = [
                    [ 'COFFEE ADVICE', 'If you need coffee to make coffee, you may have crossed a line.' ],
                    [ 'COFFEE ADVICE', 'Drink water first. Then coffee. Your future self has filed a complaint.' ],
                    [ 'COFFEE JOKE', 'I told my coffee I needed space. It said, “No problem — I’m already ground.”' ],
                    [ 'COFFEE JOKE', 'Why did the coffee file a police report? It got mugged.' ],
                    [ 'COFFEE JOKE', 'My relationship with coffee is complicated. It keeps me up, and I keep coming back.' ],
                    [ 'COFFEE RULE', 'Good coffee deserves patience. Bad coffee deserves a second chance only if you made it.' ],
                    [ 'COFFEE RULE', 'Never trust a coffee described as “surprisingly strong.” That is a warning, not a review.' ],
                ]

                const [ title, message ] = jokes[Math.floor(Math.random() * jokes.length)]

                this.game.notifications.show(
                    '<div class="top"><div class="title">' + title + '</div></div><div class="bottom"><div class="description">' + message + '</div></div>',
                    'success',
                    6,
                    null,
                    'bysho-coffee-joke'
                )
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
        screenMesh.material = new THREE.MeshBasicNodeMaterial({ color: 0x15111b })

    }

    setAchievement()
    {
        this.events.on('boundingIn', () =>
        {
            this.game.achievements.setProgress('areas', 'timeMachine')
        })
    }
}