// Game parameters
const PADDLE_WIDTH = 0.15; // Paddle width as a fraction of screen width
const PADDLE_SPEED = 0.5; // Fraction of screen width per second
const BRICK_COLUMNS = 14; // Number of brick columns
const BRICK_GAP = 0.3; //  Brick gap as a fraction of wall width
const BRICK_ROWS = 8; // Starting number of brick rows
const GAME_LIVES = 3; // Starting number of game lives
const KEY_SCORE = "highscore"; // Safe key for local storage of high score
const MARGIN = 6; // Number of empty rows above the bricks
const MAX_LEVEL = 10; // Maximum game level (+2 of bricks per level)
const MIN_BOUNCE_ANGLE = 30; // Minimum bounce angle from the horizontal in degrees
const BALL_SPEED = 0.5; // Ball speed fraction of screen width per second
const MAX_BALL_SPEED = 2; // Max ball speed fraction of screen width per second
const BALL_SPIN = 0.2; // Ball deflection of the paddle (0 = no spin, 1 = high spin)
const WALL = 0.03 // Wall/ball paddle size as a fraction of the shortest screen dimension

// Colours
const COLOR_BACKGROUND = "#262626"; // Dark grey
const COLOR_PADDLE = "#8388fc"; // Blue
const COLOR_TEXT = "#FFFFFF"; // White
const COLOR_BALL = "#FFFFFF"; // White
const COLOR_wall = "#cecece"; // Light grey

// Text 
const TEXT_FONT = "Monospace";
const TEXT_GAME_OVER = "GAME OVER";
const TEXT_LEVEL = "LEVEL";
const TEXT_LIVES = "BALL";
const TEXT_SCORE = "SCORE";
const TEXT_SCORE_HIGH = "BEST";
const TEXT_WIN = "YOU WIN!";


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
var ball, bricks = [], paddle;
var gameOver, win;
var level, lives, score, scoreHigh;
var numBricks, textSize, touchX;

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
    if (!gameOver) {
        updatePaddle(timeDelta);
        updateBall(timeDelta);
        updateBricks(timeDelta);
    }
    
    // Draw functions 
    drawBackground();
    drawWalls();
    drawPaddle();
    drawBricks();
    drawText();
    drawBall();

    // Call the next loop (aka recursion)
    requestAnimationFrame(loop);
}
    // Update the x & y velocities of the ball
function applyBallSpeed(angle) {
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
    textSize = rowH * MARGIN * 0.5;

    // column dimensions
    let totalSpaceX = width - wall * 2;
    let colW = (totalSpaceX - gap) / BRICK_COLUMNS;
    let w = colW - gap;

    // Populate bricks array;
    bricks = [];
    let cols = BRICK_COLUMNS;
    let rows = BRICK_ROWS + level * 2;
    let color, left, rank, rankHigh, score,spdMult, top;
    numBricks = cols * rows;
    rankHigh = rows * 0.5 - 1;
    for (let i = 0; i < rows; i++) {
        bricks[i] = [];
        rank = Math.floor(i * 0.5);
        score = (rankHigh - rank) * 2 + 1;
        spdMult = 1 + (rankHigh - rank) / rankHigh * (MAX_BALL_SPEED - 1);
        color = getBrickColor(rank, rankHigh);
        top = wall + (MARGIN + i) * rowH;
        for (let j = 0; j < cols; j++) {
            left = wall + gap + j * colW;
            bricks[i][j] = new Brick(left, top, w, h, color, score, spdMult);
        }
    }
}

function drawBackground() {
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, canv.width, canv.height);
}

function drawText() {
    ctx.fillStyle = COLOR_TEXT;

    // dimensions 
    let labelSize = textSize * 0.5;
    let margin = wall * 2;
    let maxWidth = width - margin * 2;
    let maxWidth1 = maxWidth * 0.27;
    let maxWidth2 = maxWidth * 0.2;
    let maxWidth3 = maxWidth * 0.2;
    let maxWidth4 = maxWidth * 0.27;
    let x1 = margin;
    let x2 = width * 0.4;
    let x3 = width * 0.6;
    let x4 = width - margin;
    let yLabel = wall + labelSize;
    let yValue = yLabel + textSize * 0.9;

    // Labels
    ctx.font = labelSize + "px " + TEXT_FONT;
    ctx.textAlign = "left";
    ctx.fillText(TEXT_SCORE, x1, yLabel, maxWidth1);
    ctx.textAlign = "center";
    ctx.fillText(TEXT_LIVES, x2, yLabel, maxWidth2);
    ctx.fillText(TEXT_LEVEL, x3, yLabel, maxWidth3);
    ctx.textAlign = "right";
    ctx.fillText(TEXT_SCORE_HIGH, x4, yLabel, maxWidth4);

    // values
    ctx.font = textSize + "px " + TEXT_FONT;
    ctx.textAlign = "left";
    ctx.fillText(score, x1, yValue, maxWidth1);
    ctx.textAlign = "center";
    ctx.fillText(lives + "/" + GAME_LIVES, x2, yValue, maxWidth2);
    ctx.fillText(level, x3, yValue, maxWidth3);
    ctx.textAlign = "right";
    ctx.fillText(scoreHigh, x4, yValue, maxWidth4);

    // Game over
    if (gameOver) {
        let text = win ? TEXT_WIN : TEXT_GAME_OVER;
        ctx.font = textSize + "px " + TEXT_FONT;
        ctx.textAlign = "center";
        ctx.fillText(text, width * 0.5, paddle.y - textSize, maxWidth);
    }
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

    // Yellow to green (reduce red colour)
    else {
        r = 255 * (1 - fraction) / 0.33;
        g = 255;
    }
    // Return the RGB colour string
    return "rgb(" + r + ", " + g + ", " + b + ")";
}

function keyDown(ev) {
    switch (ev.keyCode) {
        case 32: // space bar to launch the ball
            serve();
            if (gameOver) {
                newGame();
            }
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

// Movement speed paddle 
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

// Adjusting shape of the ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.w * 0.5, 0, Math.PI * 2);
    ctx.fill();
}

// Coloring the bricks
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

// Create new ball 
function newBall() {
    paddle = new Paddle();
    ball = new Ball();
}

// Creating a new game after game over or completed the game.
function newGame() {
    gameOver = false;
    level = 0;
    lives = GAME_LIVES;
    score = 0;
    win = false;
    
    // High score from local storage
    let scoreStr = localStorage.getItem(KEY_SCORE);
    if (scoreStr == null) {
        scoreHigh = 0;
    } else {
        scoreHigh = parseInt(scoreStr);
    }


    // Start a new level
    newLevel();
}

function newLevel() {
    touchX = null;
    newBall();
    createBricks();
}

function outOfBounds() {
    lives--; // If going out of bounds, lives goes down.
    if (lives == 0) {   // If lives is 0, game is over.
        gameOver = true;
    }
    newBall();
}

function serve() {

    // Ball already in motion and not changing direction of the ball.
    if (ball.yv != 0) {
        return false;
    }

    // Random angle (not less than min bounce angle)
    let minBounceAngle = MIN_BOUNCE_ANGLE / 180 * Math.PI; // Convert to radians
    let range = Math.PI - minBounceAngle * 2;
    let angle = Math.random() * range + minBounceAngle;
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
    ctx.textBaseline = "middle";
    newGame();
}

function spinBall() {
    // Modify angle of ball spin
    let upwards = ball.vy < 0;
    let angle = Math.atan2(-ball.yv, ball.xv); // atan2 is returning the arctangent(inversion) of a specified number
    angle += (Math.random() * Math.PI / 2 - Math.PI / 4) * BALL_SPIN;
    
    // Minimum bounce angle
    let minBounceAngle = MIN_BOUNCE_ANGLE / 180 * Math.PI; // Convert to radians
    if (upwards) {
        if (angle < minBounceAngle) {
            angle = minBounceAngle;
        } else if (angle > Math.PI - minBounceAngle) {
            angle = Math.PI - minBounceAngle;
        } else {
            if (angle > -minBounceAngle) {
                angle = -minBounceAngle;
            } else if (angle < -Math.PI + minBounceAngle) {
                angle = -Math.PI + minBounceAngle;
            }   
        }
        applyBallSpeed(angle);
    }
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
        if (gameOver) {
            newGame();
        }
        return;
    } 
    touchX = ev.touches[0].clientX;;
}

function updateBricks(delta) {

    // Check for ball collision
    OUTER: for ( let i = 0; i < bricks.length; i++) {
        for (let j = 0; j < BRICK_COLUMNS; j++) {
            if (bricks[i][j] != null && bricks[i][j].intersect(ball)) {
                updateScore(bricks[i][j].score);
                ball.setSpeed(bricks[i][j].spdMult);
                bricks[i][j] = null;
                ball.yv = -ball.yv;
                spinBall();
                numBricks--;
                break OUTER;
            }
        }
    }

    // Next level
    if (numBricks == 0) {
        if (level < MAX_LEVEL) {
            level++;
            newLevel();
        } else {
            gameOver = true;
            win = true;
            newBall();
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
        spinBall();
    } else if (ball.x > canv.width - wall - ball.w * 0.5) {
        ball.x = canv.width - wall - ball.w * 0.5;
        ball.xv = -ball.xv;
        spinBall();
    } else if (ball.y < wall + ball.h * 0.5) {
        ball.y = wall + ball.h * 0.5;
        ball.yv = -ball.yv;
        spinBall();
    }

    // Bounce of the paddle
    if (ball.y > paddle.y - paddle.h * 0.5 - ball.h * 0.5 
        && ball.y < paddle.y + paddle.h * 0.5
        && ball.x > paddle.x - paddle.w * 0.5 - ball.w * 0.5
        && ball.x < paddle.x + paddle.w * 0.5 + ball.w * 0.5
    ) {
        ball.y = paddle.y - paddle.h * 0.5 - ball.h * 0.5
        ball.yv = -ball.yv;
        spinBall();
    }

    // Handle out of bounds
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

    // Stop paddle at walls
    if (paddle.x < wall + paddle.w * 0.5) {
        paddle.x = wall + paddle.w * 0.5;
    } else if (paddle.x > canv.width - wall - paddle.w * 0.5) {
        paddle.x = canv.width - wall - paddle.w * 0.5;
    }
}

function updateScore(brickScore) {
    score += brickScore;

    // Check for highscore
    if(score > scoreHigh) {
        scoreHigh = score;
        localStorage.setItem(KEY_SCORE, score);
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

    this.setSpeed = function(spdMult) {
        this.spd = Math.max(this.spd, BALL_SPEED * height * spdMult);
        
    }
}

function Brick(left, top, w, h, color, score, spdMult) {
    this.w = w;
    this.h = h;
    this.bot = top + h;
    this.left = left;
    this.right = left + w;
    this.top = top;
    this.color = color;
    this.score = score;
    this.spdMult = spdMult;

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

