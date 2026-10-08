import * as THREE from 'three/webgpu'

const text = `
╔═ BYSHO ═════════════════════════════════╗
║ Welcome, curious human.                 ║
║ If you're reading this, keep exploring. ║
╚═════════════════════════════════════════╝

╔═ ABOUT ══════════════════════════════════╗
║ BYSHO is an interactive world built     ║
║ around curiosity, technology, creativity║
║ and whatever comes next.                ║
╚═════════════════════════════════════════╝

╔═ SOCIAL ═════════════════════════════════╗
║ YouTube   ⇒ https://www.youtube.com/@YTbyshoai
║ Instagram ⇒ https://www.instagram.com/ItsBySho
╚═════════════════════════════════════════╝

╔═ STACK ══════════════════════════════════╗
║ Rendering ⇒ Three.js (release: ${THREE.REVISION})
║ Physics   ⇒ Rapier
║ Audio     ⇒ Howler.js
╚═════════════════════════════════════════╝

╔═ RULE ═══════════════════════════════════╗
║ You're not loyal to a technology.      ║
║ You're loyal to curiosity.              ║
╚═════════════════════════════════════════╝
`
let finalText = ''
let finalStyles = []
const stylesSet = {
    letter: 'color: #ffffff; font: 400 1em monospace;',
    pipe: 'color: #D66FFF; font: 400 1em monospace;',
}
let currentStyle = null
for(let i = 0; i < text.length; i++)
{
    const char = text[i]

    const style = char.match(/[╔║═╗╚╝╔╝]/) ? 'pipe' : 'letter'
    if(style !== currentStyle)
    {
        currentStyle = style
        finalText += '%c'

        finalStyles.push(stylesSet[currentStyle])
    }
    finalText += char
}

export default [finalText, ...finalStyles]
