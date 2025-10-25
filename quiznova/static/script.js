class QuizNova {
    constructor() {
        this.socket = io();
        this.gamePin = null;
        this.isHost = false;
        this.playerName = null;

        // Basic connection log
        this.socket.on('connect', () => console.log("✅ Connected to QuizNova server"));

        // Event listeners
        this.socket.on('game_created', (data) => this.showGamePin(data.game_pin));
        this.socket.on('player_joined', (data) => this.updatePlayerList(data.players));
        this.socket.on('join_error', (data) => alert(data.message));
        this.socket.on('join_success', (data) => this.enterLobby(data.game_pin));
        this.socket.on('question_added', (data) => this.showQuestionAdded(data.question_count));
        this.socket.on('game_started', () => this.startGame());
        this.socket.on('new_question', (data) => this.handleNewQuestion(data));
        this.socket.on('answer_received', (data) => this.showAnswerFeedback(data));
        this.socket.on('game_finished', (data) => this.showFinalScores(data.final_scores));
        this.socket.on('host_disconnected', () => this.showHostDisconnected());
        this.socket.on('player_left', (data) => this.updatePlayerList(data.players));

        console.log("🎮 QuizNova initialized.");
    }

    // ======== HOST ACTIONS ========

    createGame() {
        const hostName = document.getElementById("host-name").value.trim();
        if (!hostName) return alert("Enter a host name!");
        this.isHost = true;
        this.playerName = hostName;
        this.socket.emit('create_game', { host_name: hostName });
    }

    showGamePin(pin) {
        this.gamePin = pin;
        document.getElementById("game-pin").innerText = pin;
        document.getElementById("setup").style.display = "none";
        document.getElementById("lobby").style.display = "block";
    }

    addQuestion() {
        const question = document.getElementById("question").value.trim();
        const options = [
            document.getElementById("opt1").value,
            document.getElementById("opt2").value,
            document.getElementById("opt3").value,
            document.getElementById("opt4").value
        ];
        const correct = document.querySelector('input[name="correct"]:checked');
        if (!question || !correct) return alert("Fill question and select correct answer!");

        this.socket.emit('add_question', {
            question,
            options,
            correct_answer: parseInt(correct.value),
            time_limit: 10
        });
    }

    showQuestionAdded(count) {
        alert(`✅ Question ${count} added!`);
        document.getElementById("question-form").reset();
    }

    startGame() {
        if (this.isHost) {
            this.socket.emit('start_game');
        }
        document.getElementById("lobby").style.display = "none";
        document.getElementById("game-screen").style.display = "block";
        document.getElementById("loading-screen").style.display = "block";
    }

    // ======== PLAYER ACTIONS ========

    joinGame() {
        const gamePin = document.getElementById("join-pin").value.trim();
        const playerName = document.getElementById("join-name").value.trim();
        if (!gamePin || !playerName) return alert("Enter game PIN and name!");
        this.playerName = playerName;
        this.socket.emit('join_game', { game_pin: gamePin, player_name: playerName });
    }

    enterLobby(gamePin) {
        this.gamePin = gamePin;
        document.getElementById("join-screen").style.display = "none";
        document.getElementById("lobby").style.display = "block";
    }

    updatePlayerList(players) {
        const list = document.getElementById("players-list");
        if (!list) return;
        list.innerHTML = players.map(p =>
            `<li>${p.name}${p.is_host ? " 👑" : ""}</li>`
        ).join('');
    }

    // ======== GAMEPLAY ========

    handleNewQuestion(data) {
        console.log("🟢 New question received:", data);

        const loadingScreen = document.getElementById("loading-screen");
        const questionContainer = document.getElementById("question-container");

        if (loadingScreen) loadingScreen.style.display = "none";
        if (questionContainer) {
            questionContainer.style.display = "block";
            questionContainer.innerHTML = `
                <h2>Question ${data.question_number}/${data.total_questions}</h2>
                <p>${data.question}</p>
                <ul>
                    ${data.options.map((opt, i) =>
                        `<li><button class="option-btn" data-index="${i}">${opt}</button></li>`
                    ).join('')}
                </ul>
                <p>Time left: <span id="time-left">${data.time_limit}</span>s</p>
            `;
        }

        // Start timer
        let timeLeft = data.time_limit;
        const timer = setInterval(() => {
            timeLeft--;
            const display = document.getElementById("time-left");
            if (display) display.textContent = timeLeft;
            if (timeLeft <= 0) clearInterval(timer);
        }, 1000);

        // Answer click logic
        document.querySelectorAll(".option-btn").forEach(btn => {
            btn.onclick = () => {
                const index = btn.dataset.index;
                this.socket.emit('submit_answer', { answer: parseInt(index) });
                document.querySelectorAll(".option-btn").forEach(b => b.disabled = true);
                btn.classList.add("selected");
            };
        });
    }

    showAnswerFeedback(data) {
        console.log("📩 Answer received:", data);
        const msg = document.getElementById("answer-feedback");
        if (msg) {
            msg.innerText = data.is_correct
                ? `✅ ${data.player_name} answered correctly! +${data.score}`
                : `❌ ${data.player_name} answered wrong.`;
        }
    }

    showFinalScores(scores) {
        const screen = document.getElementById("game-screen");
        screen.innerHTML = `<h2>🏆 Final Scores</h2>
            <ul>${Object.entries(scores)
                .map(([name, score]) => `<li>${name}: ${score}</li>`).join('')}
            </ul>`;
    }

    showHostDisconnected() {
        alert("⚠️ Host disconnected. Game ended.");
        window.location.href = "/";
    }
}

// Initialize game instance
window.onload = () => {
    window.quiznova = new QuizNova();
    console.log("🚀 QuizNova client ready.");
};
