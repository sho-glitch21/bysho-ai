import './threejs-override.js'
import { Game } from './Game/Game.js'
import consoleLog from './data/consoleLog.js'

if(import.meta.env.VITE_LOG)
    console.log(
        ...consoleLog
    )

const showBootError = (error) =>
{
    console.error('BYSHO boot error:', error)

    const existing = document.querySelector('.js-boot-error')
    if(existing)
        existing.remove()

    const element = document.createElement('div')
    element.className = 'js-boot-error'
    element.style.cssText = [
        'position:fixed',
        'inset:20px',
        'z-index:999999',
        'padding:24px',
        'overflow:auto',
        'background:#120f16',
        'color:#fff',
        'font:14px/1.5 monospace',
        'border:1px solid rgba(255,255,255,.25)',
        'border-radius:12px',
        'white-space:pre-wrap',
    ].join(';')

    element.textContent = 'BYSHO BOOT ERROR\\n\\n' + (error?.stack || error?.message || String(error))
    document.body.appendChild(element)
}

window.addEventListener('error', event =>
{
    if(event.error)
        showBootError(event.error)
})

window.addEventListener('unhandledrejection', event =>
{
    showBootError(event.reason)
})

if(import.meta.env.VITE_GAME_PUBLIC)
    window.game = new Game()
else
    new Game()
