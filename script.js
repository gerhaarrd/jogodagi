const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const closeMessageButton = document.getElementById('closeMessage');
const easterEggBox = document.getElementById('easterEggBox');

const TILE_SIZE = 32;

let playerA;

let playerB;

const playerSpeed = 2;
const playerBSpeed = 2.0;

let gameActive = true;
let met = false;

const GRAVITY = 0.5;
const JUMP_STRENGTH = 10;
const MAX_FALL_SPEED = 10;

let platforms = [];
let heartShots = [];
let boxWalls = [];
const HEART_SHOT_SPEED = 7;
const HEART_SHOT_SIZE = TILE_SIZE / 2.5;

const romanticMessages = [
    "Obrigado por ser essa mulher incrível e presente que você é, eu te amo!",
    "Obrigado por toda atenção e paciência que você tem comigo.",
    "Obrigado por se permitir ser minha.",
    "Sou o menino mais feliz do mundo quando tô com você.",
    "Você é a melhor namorada que eu poderia ter.",
    "Obrigado por ser quem você é.",
    "Obrigado por aceitar passar sua vida comigo."
];

const imgGerhard = new Image();
imgGerhard.src = 'gerhard.png';
const imgGi = new Image();
imgGi.src = 'gi.png';

function drawPixelHeart(x, y, size, color) {
    ctx.fillStyle = color;

    ctx.fillRect(x + size * 0.25, y + size * 0.5, size * 0.5, size * 0.5);

    ctx.fillRect(x + size * 0.1, y + size * 0.2, size * 0.4, size * 0.4);
    ctx.fillRect(x + size * 0.5, y + size * 0.2, size * 0.4, size * 0.4);

    ctx.clearRect(x + size * 0.1, y + size * 0.1, size * 0.2, size * 0.1);
    ctx.clearRect(x + size * 0.7, y + size * 0.1, size * 0.2, size * 0.1);
    ctx.clearRect(x + size * 0.0, y + size * 0.2, size * 0.1, size * 0.1);
    ctx.clearRect(x + size * 0.9, y + size * 0.2, size * 0.1, size * 0.1);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    boxWalls.forEach(wall => {
        if (!wall.isDestroyed) {
            ctx.fillStyle = wall.color;
            ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        }
    });

    platforms.forEach(platform => {
        ctx.fillStyle = platform.color || '#D7B899';
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        if (platform.hasSpikes) {
            ctx.fillStyle = '#FF6F61';
            const spikeHeight = TILE_SIZE / 3;
            const spikeBaseWidth = TILE_SIZE / 3;

            const spikePositionsX = [
                platform.x + platform.width * 0.25 - spikeBaseWidth / 2,
                platform.x + platform.width * 0.75 - spikeBaseWidth / 2
            ];

            spikePositionsX.forEach(spikeX => {
                ctx.beginPath();
                ctx.moveTo(spikeX + spikeBaseWidth / 2, platform.y - spikeHeight);
                ctx.lineTo(spikeX, platform.y);
                ctx.lineTo(spikeX + spikeBaseWidth, platform.y);
                ctx.closePath();
                ctx.fill();
            });
        }
    });

    ctx.fillStyle = playerA.color;
    ctx.fillRect(playerA.x, playerA.y, playerA.width, playerA.height);
    if (imgGerhard.complete) {
        ctx.drawImage(
            imgGerhard,
            playerA.x,
            playerA.y,
            playerA.width,
            playerA.height
        );
    }

    ctx.fillStyle = playerB.color;
    ctx.fillRect(playerB.x, playerB.y, playerB.width, playerB.height);
    if (imgGi.complete) {
        ctx.drawImage(
            imgGi,
            playerB.x,
            playerB.y,
            playerB.width,
            playerB.height
        );
    }

    heartShots.forEach(shot => {
        drawPixelHeart(shot.x, shot.y, shot.width, shot.color);
    });

    if (met) {
        const bigHeartSize = TILE_SIZE * 2;
        drawPixelHeart(
            (playerA.x + playerB.x) / 2 - bigHeartSize / 2,
            (playerA.y + playerB.y) / 2 - bigHeartSize / 2,
            bigHeartSize,
            '#ff0000'
        );
    }
}

function keepPlayerBInBox() {
    if (boxWalls.every(wall => wall.isDestroyed)) return;
    
    const boxX = boxWalls[0].x;
    const boxY = boxWalls[0].y;
    const boxSize = boxWalls[1].x + boxWalls[1].width - boxX;
    const wallThickness = boxWalls[0].height;

    const safeArea = {
        left: boxX + wallThickness,
        right: boxX + boxSize - wallThickness - playerB.width,
        top: boxY + wallThickness,
        bottom: boxY + boxSize - wallThickness - playerB.height
    };

    playerB.x = Math.max(safeArea.left, Math.min(playerB.x, safeArea.right));
    playerB.y = Math.max(safeArea.top, Math.min(playerB.y, safeArea.bottom));
}

function update() {
    if (!gameActive) return;

    keepPlayerBInBox();

    if (!playerA.onGround) {
        playerA.dy += GRAVITY;
        if (playerA.dy > MAX_FALL_SPEED) {
            playerA.dy = MAX_FALL_SPEED;
        }
    }

    playerA.x += playerA.dx;
    playerA.y += playerA.dy;

    playerA.onGround = false;

    if (playerA.x < 0) playerA.x = 0;
    if (playerA.x + playerA.width > canvas.width) playerA.x = canvas.width - playerA.width;

    for (let i = heartShots.length - 1; i >= 0; i--) {
        const shot = heartShots[i];
        let shotHit = false;

        for (let j = 0; j < boxWalls.length; j++) {
            const wall = boxWalls[j];
            if (!wall.isDestroyed &&
                shot.x < wall.x + wall.width &&
                shot.x + shot.width > wall.x &&
                shot.y < wall.y + wall.height &&
                shot.y + shot.height > wall.y) {

                wall.isDestroyed = true;
                heartShots.splice(i, 1);
                shotHit = true;

                const sideWalls = [boxWalls[1], boxWalls[3]];
                if (sideWalls.every(wall => wall.isDestroyed)) {
                    showEasterEgg();
                }
                break;
            }
        }
        
        if (shotHit) continue;

        for (let j = 0; j < platforms.length; j++) {
            const platform = platforms[j];
            if (shot.x < platform.x + platform.width &&
                shot.x + shot.width > platform.x &&
                shot.y < platform.y + platform.height &&
                shot.y + shot.height > platform.y) {

                heartShots.splice(i, 1);
                shotHit = true;
                break;
            }
        }

        if (!shotHit) {
            shot.x += HEART_SHOT_SPEED;
            if (shot.x > canvas.width) {
                heartShots.splice(i, 1);
            }
        }
    }

    playerA.onGround = false;
    boxWalls.forEach(wall => {
        if (!wall.isDestroyed) {
            if (playerA.x < wall.x + wall.width &&
                playerA.x + playerA.width > wall.x) {
                if (playerA.y < wall.y + wall.height &&
                    playerA.y + playerA.height > wall.y + wall.height &&
                    playerA.dy > 0) {
                    playerA.y = wall.y + wall.height;
                    playerA.dy = 0;
                }
                else if (playerA.y < wall.y &&
                         playerA.y + playerA.height > wall.y) {
                    playerA.y = wall.y - playerA.height;
                    playerA.dy = 0;
                    playerA.onGround = true;
                    playerA.isJumping = false;
                }
            }
            if (playerA.y < wall.y + wall.height &&
                playerA.y + playerA.height > wall.y) {
                if (playerA.x < wall.x + wall.width &&
                    playerA.x + playerA.width > wall.x + wall.width) {
                    playerA.x = wall.x + wall.width;
                }
                else if (playerA.x < wall.x &&
                         playerA.x + playerA.width > wall.x) {
                    playerA.x = wall.x - playerA.width;
                }
            }
        }
    });

    platforms.forEach(platform => {
        if (playerA.dy >= 0 &&
            playerA.x + playerA.width > platform.x &&
            playerA.x < platform.x + platform.width &&
            playerA.y + playerA.height >= platform.y &&
            playerA.y + playerA.height <= platform.y + platform.height + playerA.dy
        ) {
            if ((playerA.y - playerA.dy) + playerA.height <= platform.y + (TILE_SIZE / 4)) { 
                playerA.y = platform.y - playerA.height;
                playerA.dy = 0;
                playerA.onGround = true;
                playerA.isJumping = false;

                if (platform.hasSpikes) {
                    const spikeBaseWidth = TILE_SIZE / 3;
                    const spikePositionsX = [
                        platform.x + platform.width * 0.25 - spikeBaseWidth / 2,
                        platform.x + platform.width * 0.75 - spikeBaseWidth / 2
                    ];

                    for (const spikeX of spikePositionsX) {
                        if (playerA.x + playerA.width > spikeX && 
                            playerA.x < spikeX + spikeBaseWidth) {
                            showMessage("Você pisou nos espinhos! Cuidado!");
                            gameActive = false;
                            break;
                        }
                    }
                }
            }
        }
    });

    if (playerA.y + playerA.height > canvas.height) {
        playerA.y = canvas.height - playerA.height;
        playerA.dy = 0;
        playerA.onGround = true;
        playerA.isJumping = false;
    }

    for (let i = heartShots.length - 1; i >= 0; i--) {
        let shot = heartShots[i];
        shot.x += HEART_SHOT_SPEED;
        if (shot.x > canvas.width) {
            heartShots.splice(i, 1);
            continue;
        }
        if (Date.now() - shot.createdAt > 2000) {
            heartShots.splice(i, 1);
            continue;
        }
    }

    if (!met &&
        playerA.x < playerB.x + playerB.width &&
        playerA.x + playerA.width > playerB.x &&
        playerA.y < playerB.y + playerB.height &&
        playerA.y + playerA.height > playerB.y) {
        met = true;
        gameActive = false;
        showMessage(romanticMessages[Math.floor(Math.random() * romanticMessages.length)]);
    }
    
    if (!boxWalls.every(wall => wall.isDestroyed)) {
        const boxX = boxWalls[0].x;
        const boxY = boxWalls[0].y;
        const boxSize = boxWalls[1].x + boxWalls[1].width - boxX;
        const wallThickness = boxWalls[0].height;
        if (playerB.x < boxX + wallThickness ||
            playerB.x + playerB.width > boxX + boxSize - wallThickness ||
            playerB.y < boxY + wallThickness ||
            playerB.y + playerB.height > boxY + boxSize - wallThickness) {
            playerB.x = boxX + (boxSize - playerB.width) / 2;
            playerB.y = boxY + (boxSize - playerB.height) / 2;
        }
    }
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    if (!gameActive) return;

    switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
            if (playerA.onGround) {
                playerA.dy = -JUMP_STRENGTH;
                playerA.onGround = false;
                playerA.isJumping = true;
            }
            break;
        case 'arrowdown':
        case 's':
            break;
        case 'arrowleft':
        case 'a':
            playerA.dx = -playerSpeed;
            break;
        case 'arrowright':
        case 'd':
            playerA.dx = playerSpeed;
            break;
        case ' ':
            shootHeart();
            break;
    }
});

document.addEventListener('keyup', (e) => {
    if (!gameActive) return;

    switch (e.key.toLowerCase()) {
        case 'arrowup':
        case 'w':
        case 'arrowdown':
        case 's':
            playerA.dy = 0;
            break;
        case 'arrowleft':
        case 'a':
        case 'arrowright':
        case 'd':
            playerA.dx = 0;
            break;
    }
});

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    if (!gameActive) return;
    e.preventDefault();
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (!gameActive) return;
    e.preventDefault();
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStartX;
    const deltaY = currentY - touchStartY;
    const threshold = 10;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
            playerA.x = Math.min(canvas.width - playerA.width, playerA.x + playerSpeed);
        } else {
            playerA.x = Math.max(0, playerA.x - playerSpeed);
        }
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
        if (deltaY > 0) {
            playerA.y = Math.min(canvas.height - playerA.height, playerA.y + playerSpeed);
        } else {
            playerA.y = Math.max(0, playerA.y - playerSpeed);
        }
    }
    touchStartX = currentX;
    touchStartY = currentY;
}, { passive: false });

function showMessage(message) {
    messageText.innerText = message;
    messageBox.style.display = 'block';
}

function showEasterEgg() {
    const easterEggBox = document.getElementById('easterEggBox');
    const easterEggText = document.getElementById('easterEggText');
    easterEggText.textContent = "Esse é um texto secreto que só aparece quando você quebra as 2 paredes da caixa, parabéns por encontrar. "
    + "Queria dizer que te amo e sou muito grato por todo o amor e carinho que você me dá, queria ser capaz de demonstrar esse "
    + "sentimento de uma maneira mais clara e "
    + "queria ter mais criatividade em dar outros presentes, mas eu só sei programar" 
    + "e é uma das coisas que sou bom em fazer. Espero que você goste do meu presente pra você, o jogo tem 7 mensagens aleatórias "
    + "que aparecem ao encostar no quadradinho roxo, joga aí e tenta descobrir quais são elas!! "
    + "Eu te amo muito minha princesa, obrigado por tudo.";
    easterEggBox.style.display = 'block';
    setTimeout(() => {
        easterEggBox.style.display = 'none';
    }, 15000);
}

closeMessageButton.addEventListener('click', () => {
    resetGame();
});

function createBoxWalls() {
    const boxSize = TILE_SIZE * 1.5;
    const boxX = canvas.width - boxSize - 10;
    const boxY = canvas.height / 2 - boxSize/2;
    const wallThickness = 8;
    boxWalls = [
        { x: boxX, y: boxY, width: boxSize, height: wallThickness, color: '#D7B899', isDestroyed: false },
        { x: boxX + boxSize - wallThickness, y: boxY, width: wallThickness, height: boxSize, color: '#D7B899', isDestroyed: false },
        { x: boxX, y: boxY + boxSize - wallThickness, width: boxSize, height: wallThickness, color: '#D7B899', isDestroyed: false },
        { x: boxX, y: boxY, width: wallThickness, height: boxSize, color: '#D7B899', isDestroyed: false }
    ];
    playerB.x = boxX + (boxSize - playerB.width) / 2;
    playerB.y = boxY + (boxSize - playerB.height) / 2;
    return { boxX, boxY, boxSize };
}

function resetGame() {
    const easterEggBox = document.getElementById('easterEggBox');
    if (easterEggBox) {
        easterEggBox.style.display = 'none';
    }
    playerA.x = 0;
    playerA.y = canvas.height / 2 - TILE_SIZE / 2;
    createBoxWalls();
    gameActive = true;
    met = false;
    heartShots = [];
    document.querySelector('.message-box').style.display = 'none';
}

const dpadUp = document.getElementById('dpad-up');
const dpadDown = document.getElementById('dpad-down');
const dpadLeft = document.getElementById('dpad-left');
const dpadRight = document.getElementById('dpad-right');

function handleDpadPress(direction) {
    if (!gameActive) return;
    switch (direction) {
        case 'up':
            if (playerA.onGround) {
                playerA.dy = -JUMP_STRENGTH;
                playerA.onGround = false;
                playerA.isJumping = true;
            }
            break;
        case 'down':
            break;
        case 'left':
            playerA.dx = -playerSpeed;
            break;
        case 'right':
            playerA.dx = playerSpeed;
            break;
    }
}

function handleDpadRelease(direction) {
    if (!gameActive) return;
    switch (direction) {
        case 'up':
        case 'down':
            break;
        case 'left':
        case 'right':
            playerA.dx = 0;
            break;
    }
}

// Corrigindo os event listeners do DPAD
dpadUp.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    handleDpadPress('up'); 
}, { passive: false });

dpadUp.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleDpadRelease('up');
}, { passive: false });

dpadLeft.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    handleDpadPress('left'); 
}, { passive: false });

dpadLeft.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleDpadRelease('left');
}, { passive: false });

dpadRight.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    handleDpadPress('right'); 
}, { passive: false });

dpadRight.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleDpadRelease('right');
}, { passive: false });

// Mouse controls for DPAD
dpadUp.addEventListener('mousedown', () => handleDpadPress('up'));
dpadUp.addEventListener('mouseup', () => handleDpadRelease('up'));
dpadUp.addEventListener('mouseleave', () => handleDpadRelease('up'));

dpadLeft.addEventListener('mousedown', () => handleDpadPress('left'));
dpadLeft.addEventListener('mouseup', () => handleDpadRelease('left'));
dpadLeft.addEventListener('mouseleave', () => handleDpadRelease('left'));

dpadRight.addEventListener('mousedown', () => handleDpadPress('right'));
dpadRight.addEventListener('mouseup', () => handleDpadRelease('right'));
dpadRight.addEventListener('mouseleave', () => handleDpadRelease('right'));

const shootButton = document.getElementById('shoot-button');
shootButton.addEventListener('click', () => {
    if (gameActive) {
        shootHeart();
    }
});

shootButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameActive) {
        shootHeart();
    }
}, { passive: false });

function shootHeart() {
    if (!gameActive) return;
    const shot = {
        x: playerA.x + playerA.width,
        y: playerA.y + playerA.height / 2 - HEART_SHOT_SIZE / 2,
        width: HEART_SHOT_SIZE,
        height: HEART_SHOT_SIZE,
        color: '#FF0000',
        createdAt: Date.now()
    };
    heartShots.push(shot);
}

window.onload = function() {
    canvas.width = 600;
    canvas.height = 350;

    playerA = {
        x: 0,
        y: canvas.height / 2 - TILE_SIZE / 2,
        width: TILE_SIZE,
        height: TILE_SIZE,
        color: '#FF8C00',
        dx: 0,
        dy: 0,
        onGround: false,
        isJumping: false
    };

    const boxSize = TILE_SIZE * 1.5;
    const boxX = canvas.width - boxSize - 10;
    const boxY = canvas.height / 2 - boxSize/2;
    
    playerB = {
        x: boxX + (boxSize - TILE_SIZE)/2,
        y: boxY + (boxSize - TILE_SIZE)/2,
        width: TILE_SIZE,
        height: TILE_SIZE,
        color: '#9C27B0',
        dy: 0,
        direction: 0,
        isStatic: true 
    };

    createBoxWalls();

    platforms = [
        { x: 10, y: canvas.height - TILE_SIZE * 3, width: 100, height: TILE_SIZE / 2, color: '#D7B899', hasSpikes: false },
        { x: 150, y: canvas.height - TILE_SIZE * 5, width: 150, height: TILE_SIZE / 2, color: '#D7B899', hasSpikes: true },
        { x: 350, y: canvas.height / 2 - TILE_SIZE / 2 + TILE_SIZE, width: TILE_SIZE * 5, height: TILE_SIZE / 2, color: '#D7B899', hasSpikes: true }
    ];

    gameLoop();
};
