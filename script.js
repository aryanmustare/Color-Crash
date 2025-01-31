console.clear();

function randFloat(min, max) {
    return (Math.random() * (max - min + 1) + min);
}

function randFromArr(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
}

class Particle {
    constructor(canvas, ctx, x, y, r, color, vx, vy) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.v = { x: (Math.random() - 0.5) * vx, y: (Math.random() - 0.5) * vy };
        this.radius = r;
        this.color = color;
        this.lifetime = 250;
        this.opacity = 1;
        this.gravity = 0.25;
    }
    
    draw() {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur = 25;
        this.ctx.globalAlpha = this.opacity;
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.restore();
    }
    
    update() {
        this.x += this.v.x;
        this.y += this.v.y;
        this.v.y += this.gravity;
        this.lifetime -= 1;
        this.opacity -= 1 / this.lifetime;
        this.draw();
    }
}

class Ball {
    constructor(canvas, ctx, x, y, r, color, particles, vx, vy, skipCheck) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.x = x;
        this.y = y;
        this.radius = r;
        this.color = color;
        this.v = { x: vx || 0, y: vy || 0 };
        this.acc = 0.01;
        this.origin = { x: x, y: y };
        this.skipCheck = skipCheck;
        this.opacity = 1;
        this.particles = particles;
        this.collided = false;
    }
    
    draw() {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        this.ctx.fillStyle = this.color;
        this.ctx.shadowColor = this.color;
        this.ctx.shadowBlur = 25;
        this.ctx.globalAlpha = this.opacity;
        this.ctx.fill();
        this.ctx.closePath();
        this.ctx.restore();
    }
    
    update(balls, updateVel = false) {
        if (this.origin.y <= 0) {
            this.y += this.v.y;
        } else if (this.origin.y >= this.canvas.height) {
            this.y -= this.v.y;
        }
        if (updateVel) {
            this.y += this.v.y;
            this.x += this.v.x;
        }
        this.detectCollision(balls);
        this.draw();
    }
    
    detectCollision(balls) {
        for (let i = 0; i < balls.length; i++) {
            if (this === balls[i] || this.skipCheck) continue;
            let dist = distance(this.x, this.y, balls[i].x, balls[i].y) - this.radius * 2;
            if (dist < 0) {
                if (this.color === balls[i].color) {
                    for (let j = 0; j < Math.floor(randFloat(20, 25)); j++) {
                        this.breakParticles(this.particles, 0.4, 0.8);
                        this.collided = true;
                    }
                    this.opacity = 0;
                } else {
                    for (let j = 0; j < Math.floor(randFloat(40, 55)); j++) {
                        balls.forEach(ball => {
                            ball.opacity = 0;
                            this.breakParticles(this.particles, 2, 5, ball.x, ball.y, ball.color);
                        });
                        this.particles.forEach(p => {
                            p.gravity = 0;
                        });
                    }
                }
            }
        }
    }
    
    edgeCheck() {
        if (this.y + this.radius + this.v.y > this.canvas.height) {
            this.v.y *= -1;
        } else if (this.y - this.radius <= 0) {
            this.v.y *= -1;
        }
        if (this.x + this.radius + this.v.x > this.canvas.width) {
            this.v.x *= -1;
        } else if (this.x - this.radius <= 0) {
            this.v.x *= -1;
        }
    }
    
    breakParticles(arr, minR, maxR, x, y, color) {
        let randR = randFloat(minR, maxR);
        let randV = { x: randFloat(-20, 20), y: randFloat(-20, 20) };
        let spawnX = x || this.x;
        let spawnY = y || (this.origin.y <= 0 ? this.y + this.radius : this.y - this.radius);
        arr.push(new Particle(this.canvas, this.ctx, spawnX, spawnY, randR, color || this.color, randV.x, randV.y));
    }
    
    changeColor(defaultColor, newColor) {
        this.color = this.color !== defaultColor ? defaultColor : newColor;
    }
}

const canvas = document.querySelector('[data-canvas]');
const ctx = canvas.getContext('2d');

let maxHeight = 800, width = 400, height = innerHeight - 50 > maxHeight ? maxHeight : innerHeight - 50;
canvas.width = width;
canvas.height = height;

let retryButton = document.querySelector('.retry-btn');
let retryMessage = document.querySelector('.retry-msg');
let startButton = document.querySelector('.btn.start-btn');
let startScreen = document.querySelector('.start');

let balls = [], particles = [];
let redBall, blueBall;
let separation = 35;
let radius = 18;
let canGenerate = false;
let interval;
let ballSpeed;
let gameOver = false;
let timer = 0;
let score = 0;
let fillColor;

const colors = ['#f4bc2c', '#8c9cfb'];
let spawnPoints;

function initialize() {
    balls = [];
    particles = [];
    uselessBalls = [];
    canGenerate = true;
    interval = 2000;
    timer = 0;
    ballSpeed = 2.5;
    score = 0;
    fillColor = '#fff';

    blueBall = new Ball(canvas, ctx, width / 2, height / 2 - separation, radius, colors[1], particles, 0, 0, true);
    redBall = new Ball(canvas, ctx, width / 2, height / 2 + separation, radius, colors[0], particles, 0, 0, true);
    balls.push(redBall, blueBall);

    spawnPoints = [
        { x: width / 2, y: -50 },
        { x: width / 2, y: height + 50 }
    ];
}

let uselessBalls = [];

function initUselessBalls() {
    for (let i = 0; i < 20; i++) {
        let randVel = { x: randFloat(-5, 5), y: randFloat(-5, 5) };
        let r = randFloat(5, 10);
        uselessBalls.push(new Ball(canvas, ctx, width / 2, height / 2, r, colors[Math.floor(Math.random() * colors.length)], particles, randVel.x, randVel.y, true));
    }
    balls.push(...uselessBalls);
}

initUselessBalls();

let bgGradient = createGradient('#2c3e50', '#34495e');

function gameLoop() {
    requestAnimationFrame(gameLoop);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = fillColor;
    ctx.font = '21px sans-serif';
    ctx.fillText(`SCORE : ${score}`, 20, 35);

    uselessBalls.forEach(ball => {
        ball.update(balls, true);
        ball.edgeCheck();
    });
    if (uselessBalls.length !== 0) return;

    if (balls.length !== 0) {
        balls.forEach((ball, index) => {
            ball.update(balls);
            if (ball.collided) {
                score += 10;
                fillColor = ball.color;
            }
            if (ball.opacity <= 0) {
                ball.skipCheck = true;
                balls.splice(index, 1);
            }
        });
    }
    if (balls.length <= 1) {
        gameOver = true;
        canGenerate = false;
    }
    if (balls.length === 2) {
        canGenerate = true;
    }
    if (interval % timer === 0 && canGenerate) {
        canGenerate = false;
        spawnNewBalls();
    }

    if (particles.length !== 0) {
        particles.forEach((particle, index) => {
            particle.update();
            if (particle.opacity <= 0.05) {
                particles.splice(index, 1);
            }
        });
    }

    if (timer === 600) {
        timer = 0;
    }

    toggleOptions();
    timer++;
}

gameLoop();

function spawnNewBalls() {
    let randomPoint = randFromArr(spawnPoints);
    let randomColor = randFromArr(colors);
    balls.push(new Ball(canvas, ctx, randomPoint.x, randomPoint.y, radius, randomColor, particles, 0, ballSpeed, false));
}

function toggleOptions() {
    if (gameOver && !canGenerate) {
        retryMessage.classList.remove('hide');
        retryMessage.classList.add('show');
        retryButton.classList.remove('hide');
        retryButton.classList.add('show');
    } else if (!gameOver && canGenerate) {
        retryMessage.classList.add('hide');
        retryMessage.classList.remove('show');
        retryButton.classList.add('hide');
        retryButton.classList.remove('show');
    }
}

function createGradient(color1, color2) {
    let gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}

setInterval(() => {
    if (ballSpeed <= 7) {
        ballSpeed += 0.08;
    }
}, 1500);

canvas.addEventListener('mousedown', () => {
    redBall.changeColor(colors[0], colors[1]);
    blueBall.changeColor(colors[1], colors[0]);
});

retryButton.addEventListener('mousedown', () => {
    gameOver = false;
    initialize();
});

startButton.addEventListener('mousedown', () => {
    startScreen.classList.add('hide');
    initialize();
});

window.addEventListener('resize', () => {
    height = innerHeight - 50 > maxHeight ? maxHeight : innerHeight - 50;
    canvas.height = height;
});


