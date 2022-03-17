import 'regenerator-runtime/runtime';

const EXTRA_WORDS = 4;
const WORDS_LIST = require('/english_words.json');
const WORDS_LIST_LEN = WORDS_LIST.length; 

const circle = document.querySelector(".timer-circle");
const countdown = document.querySelector(".countdown");

const RADIUS = circle.r.baseVal.value;
const CIRCUMFERENCE = RADIUS * 2 * Math.PI;

const resetBtn = document.querySelector(".reset-btn");

const inputBox = document.querySelector(".text-input");

let inputField = document.querySelector(".input-field");
const prevWords = document.querySelector(".prev-words");
const nextWords = document.querySelector(".next-words");

const wordsPerMin = document.querySelector("#words-per-min");
const charsPerMin = document.querySelector("#chars-per-min");
const accuracy = document.querySelector("#accuracy");


class Game {
    #currentWordElement;
    #assignedWordElement;
    #wordIndex;

    constructor() {
        this.gameStateInit();
    }

    gameStateInit() {
        this.timeRemaining = 60000;
        this.assignedWords = [];
        this.typedWords = [];
        this.running = false;

        this.correctWords = 0;
        this.wrongWords = 0;
        this.charsTyped = 0;
    }

    assignWordIndex(i) {
        this.#wordIndex = i;
        this.#currentWordElement = document.querySelector(`.prev-word-${i}`);
        this.#assignedWordElement = document.querySelector(`.next-word-${i}`);
    }

    clockTick() {
        if (this.timeRemaining <= 0) {
            this.running = false;
            enableEndState();
            return;
        }

        this.timeRemaining -= 100;
        
        countdown.textContent = Math.ceil(this.timeRemaining / 1000);
        const offset = CIRCUMFERENCE - this.timeRemaining / 60000 * CIRCUMFERENCE;
        circle.style.strokeDashoffset = offset;

        setTimeout(() => {
            this.clockTick();
        }, 100);
    }

    async startGame() {
        await this.initializeWords();
        await this.startNewWord(0);
        await this.assignWordIndex(0);

        circle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
        circle.style.strokeDashoffset = 0;

        inputField.addEventListener("input", (e) => {
            this.running = true;
            inputField.addEventListener("keydown", (e2) => {
                this.handleNonLetterInput(e2);
            }, { once: true });
            this.clockTick();
            this.handleInput(e);
        }, { once: true });
    }

    markRightOrWrong() {
        const partialAssignedWord = this.assignedWords[this.#wordIndex]
            .slice(0, this.typedWords[this.#wordIndex].length)
            
        if (this.typedWords[this.#wordIndex] === partialAssignedWord) {
            this.#currentWordElement.classList.add("correct");
        } else {
            this.#currentWordElement.classList.remove("correct");
        }
    }

    handleInput(e) {
        if (e.target.value !== " ") {
            this.#assignedWordElement.textContent = this.#assignedWordElement.textContent.slice(1);
            this.#currentWordElement.textContent = this.#currentWordElement.textContent + e.target.value;

            if (!this.typedWords[this.#wordIndex]) {
                this.typedWords[this.#wordIndex] = "";
            }

            this.typedWords[this.#wordIndex] = this.typedWords[this.#wordIndex] + e.target.value;
            this.markRightOrWrong();
        }

        e.target.value = "";

        if (this.running) {
            inputField.addEventListener("input", (e2) => {
                this.handleInput(e2);
            }, { once: true });
        }
    }

    async handleNonLetterInput(e) {
        if (!this.typedWords[this.#wordIndex]) {
            if (this.running) {
                inputField.addEventListener("keydown", (e2) => {
                    this.handleNonLetterInput(e2);
                }, { once: true });
            }
            return;
        }

        if (e.key === " ") {
            if (this.typedWords[this.#wordIndex] === this.assignedWords[this.#wordIndex]) {
                this.#currentWordElement.classList.add("correct");
            } else {
                this.#currentWordElement.classList.remove("correct");
            }

            await this.finishWord();

        } else if (e.key === "Backspace") {
            const lenTyped = this.typedWords[this.#wordIndex].length;

            this.#currentWordElement.textContent = this.#currentWordElement.textContent.slice(0, lenTyped - 1);
            this.typedWords[this.#wordIndex] = this.typedWords[this.#wordIndex].slice(0, lenTyped - 1);

            const lenRemaining = this.#assignedWordElement.textContent.length;
            const lenAssigned = this.assignedWords[this.#wordIndex].length;
            const letterIndex = lenAssigned - lenRemaining - 1;

            if (letterIndex >= 0 && lenTyped <= lenAssigned) {
                const letterToAdd = this.assignedWords[this.#wordIndex][letterIndex];
                this.#assignedWordElement.textContent = letterToAdd + this.#assignedWordElement.textContent;
            }
            
            this.markRightOrWrong();
        }
        
        if (this.running) {
            inputField.addEventListener("keydown", (e2) => {
                this.handleNonLetterInput(e2);
            }, { once: true });
        }
    }

    async startNewWord(i) {
        const currentWord = document.createElement("span");
        currentWord.classList.add("prev-word");
        currentWord.classList.add(`prev-word-${i}`);

        prevWords.append(currentWord);
    }

    async finishWord() {
        await this.#assignedWordElement.remove();

        if (this.typedWords[this.#wordIndex] === this.assignedWords[this.#wordIndex]) {
            this.correctWords += 1;
            this.charsTyped += this.assignedWords[this.#wordIndex].length;
        } else {
            this.wrongWords += 1;
        }

        await updateStatistics(this.correctWords, this.wrongWords, this.charsTyped);
        await this.addNewWord(this.#wordIndex + EXTRA_WORDS);
        await this.startNewWord(this.#wordIndex + 1);
        await this.assignWordIndex(this.#wordIndex + 1);
    }

    async initializeWords() {
        for (let i = 0; i < EXTRA_WORDS; i++) {
            await this.addNewWord(i);
        }
    }

    addNewWord(i) {
        const selectedWord = WORDS_LIST[Math.floor(Math.random()*WORDS_LIST_LEN)];
        const newWordSpan = document.createElement('span');

        newWordSpan.classList.add("next-word");
        newWordSpan.classList.add(`next-word-${i}`);
        newWordSpan.textContent = selectedWord;
        nextWords.append(newWordSpan);

        this.assignedWords.push(selectedWord);
    }
}


function updateStatistics(correctWords, wrongWords, charsTyped) {
    wordsPerMin.textContent = correctWords;
    charsPerMin.textContent = charsTyped;
    accuracy.textContent = Math.round((correctWords / (correctWords + wrongWords)) * 100);
}


function enableEndState() {
    clearSelection();

    const newInput = document.createElement("input");
    newInput.type = "text";
    newInput.classList.add("input-field");
    inputBox.replaceChild(newInput, inputField);
    inputField = document.querySelector(".input-field");

    resetBtn.classList.add("show");
    countdown.classList.add("hide");
    inputField.classList.add("locked");

    resetBtn.addEventListener("click", () => {
        resetBtn.classList.remove("show");
        countdown.classList.remove("hide");
        inputField.classList.remove("locked");

        prevWords.textContent = "";
        nextWords.textContent = "";

        wordsPerMin.textContent = "0";
        charsPerMin.textContent = "0";
        accuracy.textContent = "100";
        countdown.textContent = "60";

        game.gameStateInit();
        game.startGame();
    }, { once: true });
}

function clearSelection() {
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
    } else if (document.selection) {
        document.selection.empty();
    }
}

const game = new Game();
game.startGame();
