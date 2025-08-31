// gamepad-support.js

// Configura qui la mappa pulsanti -> tasti
const BUTTON_TO_KEY = {
    0: "KeyZ",        // A (Xbox) / X (PS) -> attacco
    2: "KeyW",       // X (Xbox) / Square (PS) -> salto
    3: "KeyX",        // Y (Xbox) / Triangle (PS) -> azione alternativa
    1: "KeyC",        // B (Xbox) / Circle (PS)
    8: "Escape",      // Select/Back -> pausa/menu
    9: "Enter",       // Start/Options
};

const DEADZONE = 0.2;

// Stato per inviare eventi solo su cambiamento
const pressedKeys = new Set();
const prevButtons = new Map();
const prevAxesDir = new Map(); // per assi: "left","right","up","down"

function emitKey(type, code) {
    const evt = new KeyboardEvent(type, { code, key: codeToKey(code), bubbles: true });
    window.dispatchEvent(evt);
}

function codeToKey(code) {
    // Converte alcuni code standard a key leggibili
    switch (code) {
        case "KeyA":
        case "KeyD":
        case "KeyW":
        case "KeyZ":
        case "Space":
        case "Escape":
        case "Enter":
            return code; //.replace("Arrow", "");
        default:
            return ""; // per KeyZ/KeyX ecc. il key non è strettamente necessario
    }
}

function handleButtonChanges(pad) {
    const last = prevButtons.get(pad.index) || [];
    for (let i = 0; i < pad.buttons.length; i++) {
        const isDown = pad.buttons[i].pressed;
        const wasDown = last[i] === true;

        const code = BUTTON_TO_KEY[i];
        if (!code) {
            // nessuna mappatura per questo pulsante: salta
            continue;
        }

        if (isDown && !wasDown && !pressedKeys.has(code)) {
            pressedKeys.add(code);
            emitKey("keydown", code);
        } else if (!isDown && wasDown && pressedKeys.has(code)) {
            pressedKeys.delete(code);
            emitKey("keyup", code);
        }
    }
    prevButtons.set(pad.index, pad.buttons.map(b => b.pressed));
}

function axisToDir(value, negCode, posCode) {
    if (value < -DEADZONE) return negCode;
    if (value > DEADZONE) return posCode;
    return null;
}

function handleAxesAsDigital(pad) {
    // Converte lo stick sinistro e il d-pad (assi, se presenti) in frecce
    // Assi standard: 0: x sinistro, 1: y sinistro
    const x = pad.axes[0] ?? 0;
    const y = pad.axes[1] ?? 0;

    const leftRight = axisToDir(x, "KeyA", "KeyD");
    const upDown = axisToDir(y, "KeyW", "KeyZ");

    const keyPrev = prevAxesDir.get(pad.index) || { leftRight: null, upDown: null };

    if (leftRight !== keyPrev.leftRight) {
        // rilascia la precedente direzione orizzontale
        if (keyPrev.leftRight && pressedKeys.has(keyPrev.leftRight)) {
            pressedKeys.delete(keyPrev.leftRight);
            emitKey("keyup", keyPrev.leftRight);
        }
        // premi la nuova
        if (leftRight && !pressedKeys.has(leftRight)) {
            pressedKeys.add(leftRight);
            emitKey("keydown", leftRight);
        }
        keyPrev.leftRight = leftRight;
    }

    if (upDown !== keyPrev.upDown) {
        if (keyPrev.upDown && pressedKeys.has(keyPrev.upDown)) {
            pressedKeys.delete(keyPrev.upDown);
            emitKey("keyup", keyPrev.upDown);
        }
        if (upDown && !pressedKeys.has(upDown)) {
            pressedKeys.add(upDown);
            emitKey("keydown", upDown);
        }
        keyPrev.upDown = upDown;
    }

    prevAxesDir.set(pad.index, keyPrev);
}

function pollGamepads() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
        if (!pad) continue;
        handleButtonChanges(pad);
        handleAxesAsDigital(pad);
    }
    requestAnimationFrame(pollGamepads);
}

window.addEventListener("gamepadconnected", (e) => {
    console.log("Gamepad connesso:", e.gamepad.id);
    prevButtons.set(e.gamepad.index, []);
    prevAxesDir.set(e.gamepad.index, { leftRight: null, upDown: null });
});

window.addEventListener("gamepaddisconnected", (e) => {
    console.log("Gamepad disconnesso:", e.gamepad.id);
    // Rilascia eventuali tasti virtuali ancora attivi
    const dirs = prevAxesDir.get(e.gamepad.index);
    if (dirs) {
        for (const code of [dirs.leftRight, dirs.upDown]) {
            if (code && pressedKeys.has(code)) {
                pressedKeys.delete(code);
                emitKey("keyup", code);
            }
        }
    }
    const last = prevButtons.get(e.gamepad.index) || [];
    last.forEach((down, i) => {
        if (down) {
            const code = BUTTON_TO_KEY[i];
            if (code && pressedKeys.has(code)) {
                pressedKeys.delete(code);
                emitKey("keyup", code);
            }
        }
    });
    prevAxesDir.delete(e.gamepad.index);
    prevButtons.delete(e.gamepad.index);
});

// Avvio polling
requestAnimationFrame(pollGamepads);