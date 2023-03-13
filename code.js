const play_field = document.getElementById("field");
const difficulty_slider = document.getElementById("diff");
const hi_score = document.getElementById("high-score");
const curr_score = document.getElementById("current-score");
const curr_time = document.getElementById("current-time");
var score = 0;
const points_element_swap = -10;
const points_element_combo = 100;
const amount_elements_win = 3;
var game = [];
var selected = [-5, -5];
var time_ended = true;
const time_left = 30; //in seconds
var timer_iteration = 0;

window.onload = function() {
    resetScores();
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/*
ELEMENT SWAP GAME FUNCTIONS
*/

//loads high score from cache
function loadHighScore() {
    hi_score.innerHTML = localStorage['high_score'] || '0';
}

//save new high score to cache
function saveHighScore() {
    localStorage['high_score'] = `${score}`;
}

//add points to score
function updateScore(add_value) {
    score += add_value;
    curr_score.innerHTML = `${score}`;
}

//reset scoreboard
function resetScores() {
    score = 0;
    updateScore(0);
    loadHighScore();
}

//start game
function start() {
    //empty field
    play_field.innerHTML = "";
    game = [];
    selected = [-5, -5];
    //reset score
    if (score > Number(hi_score.innerHTML)) {
        saveHighScore();
    }
    resetScores();
    //generate field
    generateGame(difficulty_slider.value);
    timer_iteration++;
    startTimer();
}

//starts the countdown
async function startTimer() {
    var timer_i = timer_iteration;
    time_ended = false;
    var time = time_left;
    while (time > 0 && timer_i == timer_iteration) {
        displayTime(time);
        await sleep(1000);
        time--;
    }
    if (timer_i == timer_iteration) { //checks if the game was restarted before timer expired
        time_ended = true;
        displayTime(0);
        if (score > Number(hi_score.innerHTML)) {
            saveHighScore();
        }
    }
}

//displays the time left
function displayTime(time) {
    if (time == 0) {
        //display empty
        curr_time.innerHTML = "";
    } else {
        //display time
        curr_time.innerHTML = `${time}`;
        if (time > 10) {
            curr_time.style.color = "inherit";
        } else if (time > 5) {
            curr_time.style.color = "orange";
        } else {
            curr_time.style.color = "red";
        }
    }
}

//generate play field. get size from difficulty slider
function generateGame(size) {
    for (var i = 0; i < size; i++) {
        game[i] = [];
        for (var j = 0; j < size; j++) {
            game[i][j] = getRandomValue();
        }
    }
    updateField();
}

//update game field
function updateField() {
    for (var i = 0; i < game.length; i++) {
        for (var j = 0; j < game.length; j++) {
            play_field.appendChild(getNewBlock(i, j, game[i][j]));
        }
    }
}

//generate random box value
function getRandomValue() {
    var values = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    values = shuffle(values);
    return values[0];
}

//generate new block
function getNewBlock(X, Y, value) {
    var box = document.createElement("div");
    box.className = "gameblock" + classSelected(X, Y);
    box.style.gridRowStart = X;
    box.style.gridRowEnd = X + 1;
    box.style.gridColumnStart = Y;
    box.style.gridColumnEnd = Y + 1;
    box.onclick = function () {
        blockClickTimer(X, Y);
    };
    box.textContent = (value == 0 ? "" : value);
    return box;
}

//class of selected block
function classSelected(X, Y) {
    if (selected[0] == X && selected[1] == Y) {
        return " selectedblock";
    } else if (selectedIsNeighbour(X, Y)) {
        return " neighbourblock";
    } else {
        return "";
    }
}

//check if timer is up before click
function blockClickTimer(X, Y) {
    if (!time_ended) {
        blockClick(X, Y);
    }
}

//react to block click
function blockClick(X, Y) {
    if (selected[0] == X && selected[1] == Y) {
        //disselect this
        selected = [-5, -5];
    } else if (selectedIsNeighbour(X, Y)) {
        //swap two elements
        var value = game[X][Y];
        game[X][Y] = game[selected[0]][selected[1]];
        game[selected[0]][selected[1]] = value;
        //subtract points
        updateScore(points_element_swap);
        //check row/column condition
        if (game[X][Y] != 0) {
            checkConditionAt(X, Y);
        }
        //disselect
        selected = [-5, -5];
    } else {
        //set current as selected
        selected[0] = X;
        selected[1] = Y;
    }
    updateField();
}

//check if neighbouring block was selected
function selectedIsNeighbour(X, Y) {
    return (Math.abs(X - selected[0]) < 2 && Math.abs(Y - selected[1]) < 2);
}

//check row/column winning conditions
function checkConditionAt(X, Y) {
    //walk through neighbouring elements
    var allelems = [
        [X, Y]
    ];
    allelems = walk(X, Y, allelems, game[X][Y]);
    if (allelems.length >= amount_elements_win) {
        updateScore(allelems.length * points_element_combo);
        for (var i = 0; i < allelems.length; i++){
            game[allelems[i][0]][allelems[i][1]] = 0;
        }
    }
}

function walk(X, Y, allelems, value) {
    if (X - 1 > -1 && game[X - 1][Y] == value && !elemContains(allelems, X - 1, Y)) {
        allelems.push([X - 1, Y]);
        allelems = walk(X - 1, Y, allelems, value);
    }
    if (X + 1 < game.length && game[X + 1][Y] == value && !elemContains(allelems, X + 1, Y)) {
        allelems.push([X + 1, Y]);
        allelems = walk(X + 1, Y, allelems, value);
    }
    if (Y - 1 > -1 && game[X][Y - 1] == value && !elemContains(allelems, X, Y - 1)) {
        allelems.push([X, Y - 1]);
        allelems = walk(X, Y - 1, allelems, value);
    }
    if (Y + 1 < game.length && game[X][Y + 1] == value && !elemContains(allelems, X, Y + 1)) {
        allelems.push([X, Y + 1]);
        allelems = walk(X, Y + 1, allelems, value);
    }
    return allelems;
}

function elemContains(array, x, y) {
    for (var i = 0; i < array.length; i++) {
        if (array[i][0] == x && array[i][1] == y) {
            return true;
        }
    }
    return false;
}