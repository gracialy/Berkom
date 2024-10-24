function nextPage(pageNumber) {
    const currentPage = document.querySelector(`#page${pageNumber - 1}`);
    const nextPage = document.querySelector(`#page${pageNumber}`);

    currentPage.style.display = 'none';
    nextPage.style.display = 'block';
}

function prevPage(pageNumber) {
    const currentPage = document.querySelector(`#page${pageNumber + 1}`);
    const prevPage = document.querySelector(`#page${pageNumber}`);

    currentPage.style.display = 'none';
    prevPage.style.display = 'block';
}

function startGame() {
    document.querySelector('.footer-content').style.display = 'none';
    document.querySelector('.tutorial').style.display = 'none'; 
    document.getElementById('game-section').style.display = 'flex'; 
}


// GAME
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const commandContainer = document.getElementById('commandContainer');
const scoreElement = document.getElementById('score');
const iterationElement = document.getElementById('iteration');
const liveElement = document.getElementById('live');


// Constants
const GRID_SIZE = 50;
const COLS = 13;
const ROWS = 13;
const WALL_PENALTY = 5;
const PACMAN_X = 1;
const PACMAN_Y = 1;
const REWARD = 10;
const PENALTY = -10;
const MAX_ITERATION = 20;
const MAX_LIVES = 3;

// Set canvas size
canvas.width = GRID_SIZE * COLS;
canvas.height = GRID_SIZE * ROWS;

// Game state
let pacman = {
    x: PACMAN_X,
    y: PACMAN_Y,
    direction: 0,
    mouthOpen: true
};

let score = 0;
let iteration = 0;
let lives = MAX_LIVES;
let dots = [];
let walls = [];
let commands = [];
let isExecuting = false;
let loop = false;
let conditional = false;

// Initialize game
function initGame() {
    // Create walls (border)
    for (let x = 0; x < COLS; x++) {
        walls.push({x: x, y: 0});
        walls.push({x: x, y: ROWS - 1});
    }
    for (let y = 0; y < ROWS; y++) {
        walls.push({x: 0, y: y});
        walls.push({x: COLS - 1, y: y});
    }

    // Add some internal walls
    walls.push({x: 1, y: 2}, {x: 2, y: 2}, {x: 3, y: 2}, {x: 3, y: 3});
    walls.push ({x: 11, y: 2}, {x: 10, y: 2}, {x: 9, y: 2}, {x: 9, y: 3});
    walls.push({x: 6, y: 2}, {x: 6, y: 3});
    walls.push({x: 3, y: 5}, {x: 3, y: 6}, {x: 4, y: 5}, {x: 4, y: 6});
    walls.push({x: 8, y: 5}, {x: 8, y: 6}, {x: 9, y: 5}, {x: 9, y: 6});
    walls.push({x: 5, y: 8}, {x: 6, y: 8}, {x: 7, y: 8});
    walls.push({x: 2, y: 9}, {x: 2, y: 10}, {x: 3, y: 10});
    walls.push({x: 10, y: 9}, {x: 10, y: 10}, {x: 9, y: 10});

    // Create dots
    for (let x = 1; x < COLS - 1; x++) {
        for (let y = 1; y < ROWS - 1; y++) {
            if (!walls.some(wall => wall.x === x && wall.y === y) && !(x === PACMAN_X && y === PACMAN_Y)) {
                dots.push({x: x, y: y});
            }
        }
    }
}

// Draw functions
function drawPacman() {
    ctx.save();
    ctx.fillStyle = 'yellow';
    
    const centerX = pacman.x * GRID_SIZE + GRID_SIZE / 2;
    const centerY = pacman.y * GRID_SIZE + GRID_SIZE / 2;
    const radius = GRID_SIZE / 2;
    
    ctx.beginPath();
    if (pacman.mouthOpen) {
        ctx.arc(centerX, centerY, radius, 0.2 * Math.PI, 1.8 * Math.PI);
    } else {
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    }
    ctx.lineTo(centerX, centerY);
    ctx.fill();
    ctx.restore();
}

function drawDots() {
    ctx.fillStyle = 'white';
    dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(
            dot.x * GRID_SIZE + GRID_SIZE / 2,
            dot.y * GRID_SIZE + GRID_SIZE / 2,
            2,
            0,
            Math.PI * 2
        );
        ctx.fill();
    });
}

function drawWalls() {
    ctx.fillStyle = "#29339b";
    walls.forEach(wall => {
        ctx.fillRect(
            wall.x * GRID_SIZE,
            wall.y * GRID_SIZE,
            GRID_SIZE,
            GRID_SIZE
        );
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawWalls();
    drawDots();
    drawPacman();
}

// Command handling
function addCommand(type, imgSrc) {
    if (isExecuting) return;

    if (commands.length >= 10) {
        alert('Maximum 10 commands allowed!');
        return;
    }
    
    const commandElement = document.createElement('div');
    commandElement.className = 'command';
    
    const img = document.createElement('img');
    img.src = imgSrc;
    commandElement.appendChild(img);
    
    commandElement.addEventListener('click', () => {
        const index = commands.indexOf(type);
        if (index > -1) {
            commands.splice(index, 1);
            commandElement.remove();
        }
    });
    
    commandContainer.appendChild(commandElement);
    commands.push(type);
}

function updateScore(points) {
    score = Math.max(0, score + points); // no negative
    scoreElement.textContent = score;
}

function updateIteration() {
    iteration++;
    iterationElement.textContent = iteration;
}

function updateLive() {
    lives--;
    liveElement.textContent = lives;
}

// Movement and game logic
function canMove(x, y) {
    return !walls.some(wall => wall.x === x && wall.y === y);
}

function checkDotCollision() {
    const dotIndex = dots.findIndex(dot => 
        dot.x === pacman.x && dot.y === pacman.y
    );
    
    if (dotIndex !== -1) {
        dots.splice(dotIndex, 1);
        updateScore(REWARD);
        updateLive();
        
        if (dots.length === 0) {
            alert('You win! Game will restart.');
            resetGame();
        }
    }
}

async function executeCommands() {
    if (isExecuting) return;
    isExecuting = true;

    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        switch (command) {
            case 'loop':
                if (i + 1 < commands.length) { 
                    const nextCommand = commands[i + 1];
                    loop = true;
                    while (loop && !await willCollide(nextCommand)) {
                        await defineAction(nextCommand);
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                    i++; 
                }
                break;
            case 'conditional':
                if (i + 1 < commands.length) {
                    const nextCommand = commands[i + 1];
                    conditional = true;
                    await defineAction(nextCommand);
                    while (conditional && !await isIntersecting()) {
                        await defineAction(nextCommand);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        if (await isIntersecting()) {
                            conditional = false;
                        }
                    }
                    i++;
                }
                break;
            default:
                await defineAction(command);
                break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    updateIteration();

    isExecuting = false;
    commands = [];
    commandContainer.innerHTML = '';

    if (iteration >= MAX_ITERATION) {
        alert(`You lose! Your score is ${score}. Game will restart.`);
        resetGame();
    }
}

async function willCollide(command) {
    switch (command) {
        case 'up':
            return !canMove(pacman.x, pacman.y - 1);
        case 'down':
            return !canMove(pacman.x, pacman.y + 1);
        case 'left':
            return !canMove(pacman.x - 1, pacman.y);
        case 'right':
            return !canMove(pacman.x + 1, pacman.y);
    }
}

async function isIntersecting() {
    const possibleMoves = [
        { dx: 1, dy: 0 },  // right
        { dx: -1, dy: 0 }, // left
        { dx: 0, dy: 1 },  // down
        { dx: 0, dy: -1 }  // up
    ];

    let legalMoves = 0;

    for (const move of possibleMoves) {
        const newX = pacman.x + move.dx;
        const newY = pacman.y + move.dy;
        if (canMove(newX, newY)) {
            console.log('Legal move:', newX, newY);
            legalMoves++;
        }
    }

    return legalMoves > 2;
}

async function defineAction(command) {
    switch (command) {
        case 'up':
            await move(0, -1);
            break;
        case 'down':
            await move(0, 1);
            break;
        case 'left':
            await move(-1, 0);
            break;
        case 'right':
            await move(1, 0);
            break;
        case 'conditional':
            loop = false;
            break;
        case 'loop':
            loop = true;
            break;
    }
}

async function move(dx, dy) {
    const newX = pacman.x + dx;
    const newY = pacman.y + dy;
    
    if (canMove(newX, newY)) {
        pacman.x = newX;
        pacman.y = newY;
        pacman.mouthOpen = !pacman.mouthOpen;
        checkDotCollision();
    } else {
        updateScore(PENALTY);
        ctx.fillStyle = "#ff3a20";
        ctx.fillRect(
            newX * GRID_SIZE,
            newY * GRID_SIZE,
            GRID_SIZE,
            GRID_SIZE
        );
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    draw();
}

function resetGame() {
    pacman = {x: 1, y: 1, direction: 0, mouthOpen: true};
    score = 0;
    scoreElement.textContent = score;
    dots = [];
    walls = [];
    commands = [];
    commandContainer.innerHTML = '';
    isExecuting = false;
    initGame();
    draw();
}

// Event listeners
document.querySelector('.up').addEventListener('click', () => addCommand('up', 'img/circle-up-solid.svg'));
document.querySelector('.down').addEventListener('click', () => addCommand('down', 'img/circle-down-solid.svg'));
document.querySelector('.left').addEventListener('click', () => addCommand('left', 'img/circle-left-solid.svg'));
document.querySelector('.right').addEventListener('click', () => addCommand('right', 'img/circle-right-solid.svg'));
document.querySelector('.run').addEventListener('click', executeCommands);
document.querySelector('.delete').addEventListener('click', () => {
    if (!isExecuting) {
        commands.pop();
        if (commandContainer.lastChild) {
            commandContainer.removeChild(commandContainer.lastChild);
        }
    }
});
document.querySelector('.loop').addEventListener('click', () => addCommand('loop', 'img/road-barrier-solid.svg'));
document.querySelector('.conditional').addEventListener('click', () => addCommand('conditional', 'img/traffic-light-solid.svg'));

// Initialize and start game
initGame();
draw();

// Make game responsive
function resizeCanvas() {
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    const scale = containerWidth / canvas.width;
    
    if (scale < 1) {
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = (canvas.height * scale) + 'px';
    } else {
        canvas.style.width = canvas.width + 'px';
        canvas.style.height = canvas.height + 'px';
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();