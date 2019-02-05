// Game parameters
const HEIGHT = 550; // pixels
const PADDLE_SPEED = 0.7; // fraction of screen width per second
const BALL_SPEED = 0.5; // ball speed fraction of screen width per second
const BALL_SPIN = 1; // ball deflection of the paddle (0 = no spin, 1 = high spin)

// Derived dimensions
const WIDTH = HEIGHT * 0.9;
const WALL = WIDTH / 50;
const PADDLE_HEIGHT = WALL;
const BALL_SIZE = WALL;
const PADDLE_WIDTH = PADDLE_HEIGHT * 5;

// Colours
const COLOR_BACKGROUND = "#000000"; // black
const COLOR_PADDLE = "#ffffff"; // white
const COLOR_BALL = "#FF0000"; // red
const COLOR_WALL = "#969696"; // grey

// Definitions
const Direction = {
    LEFT: 0,
    RIGHT: 1,
    STOP: 2
}

// Game canvas
var canv = document.createElement("canvas");
canv.width = WIDTH;
canv.height = HEIGHT;
document.body.appendChild(canv);

// Context (Refer to the object to which a function belongs.)
var ctx = canv.getContext("2d"); 
ctx.lineWidth = WALL; // thickness wall

// Game variables
var ball, paddle;

// Start a new game
newGame();

// Event listeners
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

// Game loop
var timeDelta, timeLast; 
requestAnimationFrame(loop);

function loop(timeNow) {
    if(!timeLast) {
        timeLast = timeNow;
    }

    // Calculate time difference
    timeDelta = (timeNow - timeLast) / 1000; // calculate in seconds
    timeLast = timeNow;

    // Update function for position movements
    updatePaddle(timeDelta);
    updateBall(timeDelta);

    // Draw 
    drawBackground();
    drawWalls();
    drawPaddle();
    drawBall();

    // Call the next loop (aka recursion)
    requestAnimationFrame(loop);
}

function applyBallSpeed(angle) {

    console.log("intendedAngle=" + angle);

    // keep angle between 30 & 150 degrees
    if (angle < Math.PI / 6) {
        angle = Math.PI / 6;
    } else if (angle > Math.PI * 5 / 6) {
        angle = Math.PI * 5 / 6;
    }

    console.log("outputAngle=" + angle);

    // Update the x & y velocities of the ball
    ball.xv = ball.spd * Math.cos(angle);
    ball.yv = -ball.spd * Math.sin(angle); // Shoot the ball up
}

// Drawing functions
function drawBackground() {
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, canv.width, canv.height);
}

function drawWalls() {
    let halfWall = WALL * 0.5;
    ctx.strokeStyle = COLOR_WALL;
    ctx.beginPath();
    ctx.moveTo(halfWall, HEIGHT);
    ctx.lineTo(halfWall, halfWall);
    ctx.lineTo(WIDTH - halfWall, halfWall);
    ctx.lineTo(WIDTH - halfWall, HEIGHT);
    ctx.stroke();
}

function keyDown(ev) {
    switch (ev.keyCode) {
        case 32: // space bar to serve the ball
            serve();
            break;
        case 37: // left arrow key to move paddle LEFT
            movePaddle(Direction.LEFT);
            break;
        case 39: // right arrow key to move paddle RIGHT
            movePaddle(Direction.RIGHT);
            break;
    }
}

function keyUp(ev) {
    switch (ev.keyCode) {
        case 37: // left arrow key to stop paddle moving
        case 39: // right arrow key to stop paddle moving
            movePaddle(Direction.STOP);
            break;
    }
}

function movePaddle(direction) {
    switch(direction) {
        case Direction.LEFT:
            paddle.xv = -paddle.spd;
            break;
        case Direction.RIGHT:
            paddle.xv = paddle.spd;
            break;
        case Direction.STOP:
            paddle.xv = 0;
            break;
    }
}

function drawBall() {
    ctx.fillStyle = COLOR_BALL;
    ctx.fillRect(ball.x - ball.w * 0.5, ball.y - ball.h * 0.5, ball.w, ball.h);
}

function drawPaddle() {
    ctx.fillStyle = COLOR_PADDLE;
    ctx.fillRect(paddle.x - paddle.w * 0.5, paddle.y - paddle.h * 0.5, paddle.w, paddle.h);
}

function newGame() {
    paddle = new Paddle();
    ball = new Ball();
}

function outOfBounds() {
    // Todo out of bounds
    newGame();
}

function serve() {

    // Ball already in motion and not changing direction of the ball.
    if (ball.yv != 0) {
        return;
    }

    // random angle
    let angle = Math.random() * Math.PI / 2 + Math.PI / 4;
    // Apply ball speed for the angle
    applyBallSpeed(angle);

}

function updateBall(delta) {
    ball.x += ball.xv * delta;
    ball.y += ball.yv * delta;

    // Bounce the ball of the walls
    if (ball.x < WALL + ball.w * 0.5) {
        ball.x = WALL + ball.w * 0.5;
        ball.xv = -ball.xv;
    } else if (ball.x > canv.width - WALL - ball.w * 0.5) {
        ball.x = canv.width - WALL - ball.w * 0.5;
        ball.xv = -ball.xv;
    } else if (ball.y < WALL + ball.h * 0.5) {
        ball.y = WALL + ball.h * 0.5;
        ball.yv = -ball.yv;
    }

    // Bounce of the paddle
    if (ball.y > paddle.y - paddle.h * 0.5 - ball.h * 0.5 
        && ball.y < paddle.y
        && ball.x > paddle.x - paddle.w * 0.5 - ball.w * 0.5
        && ball.x < paddle.x + paddle.w * 0.5 + ball.w * 0.5
    ) {
        ball.y = paddle.y - paddle.h * 0.5 - ball.h * 0.5
        ball.yv = -ball.yv;

        // Modify angle of ball spin
        let angle = Math.atan2(-ball.yv, ball.xv); // atan2 is returning the arctangent(inversion) of a specified number
        angle += (Math.random() * Math.PI / 2 - Math.PI / 4) * BALL_SPIN;
        applyBallSpeed(angle);
    }

    // handle out of bounds
    if (ball.y > canv.height) {
        outOfBounds();
    }
    // Move the ball with the paddle
    if (ball.yv == 0) {
        ball.x = paddle.x;
    }
}

function updatePaddle(delta) {
    paddle.x += paddle.xv * delta;

    // stop paddle at walls
    if (paddle.x < WALL + paddle.w * 0.5) {
        paddle.x = WALL + paddle.w * 0.5;
    } else if (paddle.x > canv.width - WALL - paddle.w * 0.5) {
        paddle.x = canv.width - WALL - paddle.w * 0.5;
    }
}
// Positioning the ball
function Ball() {
    this.w = BALL_SIZE;
    this.h = BALL_SIZE;
    // Ball sitting on the paddle
    this.x = paddle.x;
    this.y = paddle.y - paddle.h / 2 - this.h / 2;
    this.spd = BALL_SPEED * WIDTH;
    this.xv = 0;
    this.yv = 0;
}

// Positioning paddle
function Paddle() {
    this.w = PADDLE_WIDTH;
    this.h = PADDLE_HEIGHT;
    this.x = canv.width / 2;
    this.y = canv.height - this.h * 3;
    this.spd = PADDLE_SPEED * WIDTH;
    this.xv = 0;
}

