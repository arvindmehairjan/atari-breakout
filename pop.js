// Game parameters
const PADDLE_WIDTH = 0.1; // paddle width as a fraction of screen width
const PADDLE_SPEED = 0.5; // fraction of screen width per second
const BRICK_COLUMNS = 14; //  number of brick columns
const BRICK_GAP = 0.3; //  Brick gap as a fraction of wall width
const BRICK_ROWS = 8; // Starting number of brick rows
const MARGIN = 6; // Number of empty rows above the bricks
const MAX_LEVEL = 10; // Maximum game level (+2 of bricks per level)
const BALL_SPEED = 0.5; // ball speed fraction of screen width per second
const BALL_SPIN = 0.2; // ball deflection of the paddle (0 = no spin, 1 = high spin)
const WALL = 0.02 // wall/ball paddle size as a fraction of the shortest screen dimension

// Colours
const COLOR_BACKGROUND = "#000000"; // black
const COLOR_PADDLE = "#00FFFF"; // blue
const COLOR_BALL = "#ffffff"; // red
const COLOR_wall = "#969696"; // grey

// Definitions
const Direction = {
    LEFT: 0,
    RIGHT: 1,
    STOP: 2
}

// Game canvas & context
var canv = document.createElement("canvas");
document.body.appendChild(canv);
var ctx = canv.getContext("2d"); 

// Game variables
var ball, bricks = [], level, paddle, touchX;

//Dimensions
var height, width, wall;
setDimensions();

// Event listeners
canv.addEventListener("touchcancel", touchCancel);
canv.addEventListener("touchend", touchEnd);
canv.addEventListener("touchmove", touchMove);
canv.addEventListener("touchstart", touchStart);
document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);
window.addEventListener("resize", setDimensions);

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
    updateBricks(timeDelta);

    // Draw 
    drawBackground();
    drawWalls();
    drawPaddle();
    drawBricks();
    drawBall();

    // Call the next loop (aka recursion)
    requestAnimationFrame(loop);
}

function applyBallSpeed(angle) {

    // keep angle between 30 & 150 degrees
    if (angle < Math.PI / 6) {
        angle = Math.PI / 6;
    } else if (angle > Math.PI * 5 / 6) {
        angle = Math.PI * 5 / 6;
    }

    // Update the x & y velocities of the ball
    ball.xv = ball.spd * Math.cos(angle);
    ball.yv = -ball.spd * Math.sin(angle); // Shoot the ball up
}

function createBricks() {

    // row dimensions
    let minY = wall;
    let maxY = ball.y - ball.h * 3.5;
    let totalSpaceY = maxY - minY;
    let totalRows = MARGIN + BRICK_ROWS + MAX_LEVEL * 2;
    let rowH = totalSpaceY / totalRows;
    let gap = wall * BRICK_GAP;
    let h = rowH - gap;

    // column dimensions
    let totalSpaceX = width - wall * 2;
    let colW = (totalSpaceX - gap) / BRICK_COLUMNS;
    let w = colW - gap;

    // Populate bricks array;
    bricks = [];
    let cols = BRICK_COLUMNS;
    let rows = BRICK_ROWS + level * 2;
    let color, left, rank, rankHigh, top;
    rankHigh = rows * 0.5 - 1;
    for (let i = 0; i < rows; i++) {
        bricks[i] = [];
        rank = Math.floor(i * 0.5);
        color = getBrickColor(rank, rankHigh);
        top = wall + (MARGIN + i) * rowH;
        for (let j = 0; j < cols; j++) {
            left = wall + gap + j * colW;
            bricks[i][j] = new Brick(left, top, w, h, color);
        }
    }
}

// Drawing functions
function drawBackground() {
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, canv.width, canv.height);
}

function drawWalls() {
    let halfwall = wall * 0.5;
    ctx.strokeStyle = COLOR_wall;
    ctx.beginPath();
    ctx.moveTo(halfwall, height);
    ctx.lineTo(halfwall, halfwall);
    ctx.lineTo(width - halfwall, halfwall);
    ctx.lineTo(width - halfwall, height);
    ctx.stroke();
}
// Red = 0, orange = 0.33, yellow = 0.67, green = 1
function getBrickColor(rank, highestRank) { // Rank refers to color of the rows
    let fraction = rank / highestRank;
    let r, g, b = 0;

    // Red to orange to yellow (increase to green)
if (fraction <= 0.67) {
    r = 255;
    g = 255 * fraction / 0.67;
}

    // Yellow to green (reduce red )
    else {
        r = 255 * (1 - fraction) / 0.33;
        g = 255;
    }
    // Return the RGB colour string
    return "rgb(" + r + ", " + g + ", " + b + ")";
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

function drawBricks() {
    for (let row of bricks) {
        for (let brick of row) {
            if (brick == null) {
                continue;
            }
            ctx.fillStyle = brick.color;
            ctx.fillRect(brick.left, brick.top, brick.w, brick.h);
        }
    }
}

function drawPaddle() {
    ctx.fillStyle = COLOR_PADDLE;
    ctx.fillRect(paddle.x - paddle.w * 0.5, paddle.y - paddle.h * 0.5, paddle.w, paddle.h);
}

function newGame() {
    paddle = new Paddle();
    ball = new Ball();
    level = 0;
    touchX = null;
    createBricks();
}

function outOfBounds() {
    // Todo out of bounds
    newGame();
}

function serve() {

    // Ball already in motion and not changing direction of the ball.
    if (ball.yv != 0) {
        return false;
    }

    // random angle
    let angle = Math.random() * Math.PI / 2 + Math.PI / 4;
    // Apply ball speed for the angle
    applyBallSpeed(angle);
    return true;

}

function setDimensions() {
    height = window.innerHeight; 
    width = window.innerWidth;
    wall = WALL * (height < width ? height : width);
    canv.width = width;
    canv.height = height;
    ctx.linewidth = wall; // thickness wall
    newGame();
}

function touchCancel(ev) {
    touchX = null;
    movePaddle(Direction.STOP); 
}

function touchEnd(ev) {
    touchX = null;
    movePaddle(Direction.STOP); 
}

function touchMove(ev) {
    touchX = ev.touches[0].clientX;
}

function touchStart(ev) {
    if (serve()) {
        return;
    } 
    touchX = ev.touches[0].clientX;;
}

function updateBricks(delta) {
    // check for ball collision
    OUTER: for ( let i = 0; i < bricks.length; i++) {
        for (let j = 0; j < BRICK_COLUMNS; j++) {
            if (bricks[i][j] != null && bricks[i][j].intersect(ball)) {
                bricks[i][j] = null;
                ball.yv = -ball.yv;
                // TODO score ETC
                break OUTER;
            }
        }
    }
}

function updateBall(delta) {
    ball.x += ball.xv * delta;
    ball.y += ball.yv * delta;

    // Bounce the ball of the walls
    if (ball.x < wall + ball.w * 0.5) {
        ball.x = wall + ball.w * 0.5;
        ball.xv = -ball.xv;
    } else if (ball.x > canv.width - wall - ball.w * 0.5) {
        ball.x = canv.width - wall - ball.w * 0.5;
        ball.xv = -ball.xv;
    } else if (ball.y < wall + ball.h * 0.5) {
        ball.y = wall + ball.h * 0.5;
        ball.yv = -ball.yv;
    }

    // Bounce of the paddle
    if (ball.y > paddle.y - paddle.h * 0.5 - ball.h * 0.5 
        && ball.y < paddle.y + paddle.h * 0.5
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

    // Handle touch
    if (touchX != null) {
         if (touchX > paddle.x + wall) {
            movePaddle(Direction.RIGHT);
        } else if (touchX < paddle.x - wall) {
            movePaddle(Direction.LEFT);
        } else {
            movePaddle(Direction.STOP);
        }
    }
    // Move the paddle
    paddle.x += paddle.xv * delta;

    // stop paddle at walls
    if (paddle.x < wall + paddle.w * 0.5) {
        paddle.x = wall + paddle.w * 0.5;
    } else if (paddle.x > canv.width - wall - paddle.w * 0.5) {
        paddle.x = canv.width - wall - paddle.w * 0.5;
    }
}
// Positioning the ball
function Ball() {
    this.w = wall;
    this.h = wall;
    // Ball sitting on the paddle
    this.x = paddle.x;
    this.y = paddle.y - paddle.h / 2 - this.h / 2;
    this.spd = BALL_SPEED * height;
    this.xv = 0;
    this.yv = 0;

    
}

function Brick(left, top, w, h, color) {
    this.w = w;
    this.h = h;
    this.bot = top + h;
    this.left = left;
    this.right = left + w;
    this.top = top;
    this.color = color;

    this.intersect = function(ball) {
        let ballBottom = ball.y + ball.h * 0.5;
        let ballLeft = ball.x - ball.w * 0.5;
        let ballRight = ball.x + ball.w * 0.5;
        let ballTop = ball.y - ball.h * 0.5;
        return this.left < ballRight 
            && ballLeft < this.right
            && this.bot > ballTop
            && ballBottom > this.top;
    }
}

// Positioning paddle
function Paddle() {
    this.w = PADDLE_WIDTH * width;
    this.h = wall;
    this.x = canv.width / 2;
    this.y = canv.height - this.h * 3;
    this.spd = PADDLE_SPEED * width;
    this.xv = 0;
}

