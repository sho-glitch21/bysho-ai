import './threejs-override.js'
import { Game } from './Game/Game.js'
import consoleLog from './data/consoleLog.js'

if(import.meta.env.VITE_LOG)
    console.log(
        ...consoleLog
    )

const showBootError = (error, label = 'BYSHO BOOT ERROR') =>
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

    const details = error?.stack || error?.message || (typeof error === 'string' ? error : JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2)) || String(error)
    element.textContent = label + '\\n\\nStage: ' + (window.__BYSHO_BOOT_STAGE__ || 'unknown') + '\\n\\n' + details
    document.body.appendChild(element)
}

window.addEventListener('error', event =>
{
    showBootError(event.error || new Error(event.message || 'Unknown window error'))
})

window.addEventListener('unhandledrejection', event =>
{
    const reason = event.reason ?? new Error('Unhandled promise rejection with no reason')
    showBootError(reason, 'BYSHO UNHANDLED REJECTION')
})

if(import.meta.env.VITE_GAME_PUBLIC)
    window.game = new Game()
else
    new Game()
