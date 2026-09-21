const canvas = document.getElementById("galagaCanvas");
const ctx = canvas.getContext("2d");

// Game Control & Engine State
let score = 0;
let satoshis = 0;
let gameActive = true;

// Arcade Accurate Fighter Config: Fixed horizontal bounding axis
let player = { 
    x: 205, 
    y: 430, // Locked near bottom matching original arcade screen layout ratio
    width: 30, 
    height: 30, 
    speed: 4.5 
};

let lasers = [];
let enemies = [];
let stars = [];

// Tracks active control inputs from both keyboard and mobile touch events
let inputs = { left: false, right: false, fire: false };

// Starfield Generation
for(let i = 0; i < 35; i++) {
    stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, speed: Math.random() * 2 + 1 });
}

// Classic Grid Matrix Setup
function initEnemies() {
    enemies = [];
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
            enemies.push({
                x: 60 + col * 42,
                y: 60 + row * 35,
                width: 24,
                height: 18,
                points: (3 - row) * 100,
                direction: 1,
                moveTimer: 0
            });
        }
    }
}
initEnemies();

// DESKTOP KEYBOARD LISTENERS
window.addEventListener("keydown", e => {
    if (e.code === "ArrowLeft") inputs.left = true;
    if (e.code === "ArrowRight") inputs.right = true;
    if (e.code === "Space") inputs.fire = true;
});
window.addEventListener("keyup", e => {
    if (e.code === "ArrowLeft") inputs.left = false;
    if (e.code === "ArrowRight") inputs.right = false;
    if (e.code === "Space") inputs.fire = false;
});

// MOBILE TOUCH SCREEN EVENT LISTENERS
setupTouchButton("left-btn", "left");
setupTouchButton("right-btn", "right");
setupTouchButton("fire-btn", "fire");

function setupTouchButton(elementId, inputAction) {
    const btn = document.getElementById(elementId);
    if (!btn) return;
    
    // Touch Start
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        inputs[inputAction] = true;
    }, { passive: false });

    // Touch End / Cancel
    btn.addEventListener("touchend", (e) => {
        e.preventDefault();
        inputs[inputAction] = false;
    }, { passive: false });
}

function update() {
    if (!gameActive) return;

    // Arcade-Accurate Linear Bounded Horizontal Ship Mechanics
    if (inputs.left && player.x > 5) {
        player.x -= player.speed;
    }
    if (inputs.right && player.x < canvas.width - player.width - 5) {
        player.x += player.speed;
    }

    // Weapons Fire Throttle Control
    if (inputs.fire) {
        // Limits maximum active projectile nodes concurrently in flight to emulate hardware limits
        if (lasers.length === 0 || lasers[lasers.length - 1].y < player.y - 95) {
            lasers.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 12 });
        }
    }

    // Move Starfield Background
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) star.y = 0;
    });

    // Projectiles Loop
    lasers.forEach((laser, lIdx) => {
        laser.y -= 7.5;
        if (laser.y < 0) lasers.splice(lIdx, 1);
    });

    // Grid Animation Shifting Calculations
    let globalShift = false;
    enemies.forEach(enemy => {
        enemy.moveTimer++;
        if(enemy.moveTimer % 55 === 0) {
            enemy.x += 12 * enemy.direction;
            if(enemy.x > canvas.width - enemy.width - 10 || enemy.x < 10) {
                globalShift = true;
            }
        }
    });

    if(globalShift) {
        enemies.forEach(enemy => {
            enemy.direction *= -1;
            enemy.y += 8;
        });
    }

    // Core Collision Tracking
    lasers.forEach((laser, lIdx) => {
        enemies.forEach((enemy, eIdx) => {
            if (laser.x < enemy.x + enemy.width &&
                laser.x + laser.width > enemy.x &&
                laser.y < enemy.y + enemy.height &&
                laser.y + laser.height > enemy.y) {
                
                score += enemy.points;
                satoshis += 1; 
                
                enemies.splice(eIdx, 1);
                lasers.splice(lIdx, 1);
                updateUI();

                if(enemies.length === 0) {
                    triggerAdInterstitials();
                }
            }
        });
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Starfield background
    ctx.fillStyle = "#ffffff";
    stars.forEach(star => ctx.fillRect(star.x, star.y, 2, 2));

    // Draw Player Arcade Starship Node
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(player.x + player.width / 2, player.y);
    ctx.lineTo(player.x, player.y + player.height);
    ctx.lineTo(player.x + player.width, player.y + player.height);
    ctx.closePath();
    ctx.fill();
    
    // Draw Retro Wing Fins Details
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(player.x, player.y + player.height - 10, 4, 10);
    ctx.fillRect(player.x + player.width - 4, player.y + player.height - 10, 4, 10);

    // Draw Lasers
    ctx.fillStyle = "#ffff00";
    lasers.forEach(laser => ctx.fillRect(laser.x, laser.y, laser.width, laser.height));

    // Draw Alien Invaders
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.points === 300 ? "#ff0000" : (enemy.points === 200 ? "#0000ff" : "#00ff00");
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(enemy.x + 4, enemy.y + 4, 3, 3);
        ctx.fillRect(enemy.x + enemy.width - 7, enemy.y + 4, 3, 3);
    });

    // Interstitial Ad Display Layer
    if (!gameActive) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#00ffff";
        ctx.font = "18px 'Courier New'";
        ctx.textAlign = "center";
        ctx.fillText("[ STREAMING VIDEO AD ]", canvas.width / 2, canvas.height / 2 - 15);
        ctx.font = "12px 'Courier New'";
        ctx.fillStyle = "#888888";
        ctx.fillText("Validating ad revenue network credentials...", canvas.width / 2, canvas.height / 2 + 15);
    }
}

function updateUI() {
    let btcString = (satoshis * 0.00000001).toFixed(8);
    document.getElementById("ui-score").innerText = `${btcString} BTC`;
    document.getElementById("ui-sats").innerText = satoshis;
    const withdrawBtn = document.getElementById("withdraw-btn");
    if (withdrawBtn && satoshis > 0) withdrawBtn.disabled = false;
}

function triggerAdInterstitials() {
    gameActive = false;
    inputs.left = false;
    inputs.right = false;
    inputs.fire = false;
    
    setTimeout(() => {
        gameActive = true;
        initEnemies();
    }, 4000); // 4-second ad view time allocation
}

async function triggerWithdrawal() {
    const lnAddress = prompt("Enter your Lightning Address (e.g., wallet@zbd.gg):");
    if (!lnAddress) return;

    try {
        const res = await fetch("http://localhost:3000/api/payout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: lnAddress, amount: satoshis })
        });
        const payload = await res.json();
        
        if (payload.success) {
            alert(`Payout complete! Trans ID: ${payload.checking_id}`);
            satoshis = 0;
            updateUI();
        } else {
            alert(`System Error: ${payload.message}`);
        }
    } catch (e) {
        alert("Backend infrastructure disconnected. Please verify server.js is running.");
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
loop();
