class QuizNovaClient {
    constructor() {
        this.socket = null;
        this.gamePin = '';
        this.isHost = false;
        this.playerName = '';
        this.currentQuestion = null;
        this.timeLeft = 30;
        this.timerInterval = null;
        this.playerScore = 0;
        this.init();
    }

    init() {
        this.socket = io();
        this.setupEventListeners();
        this.loadStoredData();
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('✅ Connected to server');

            // 🔁 Try rejoining automatically
            const storedPin = localStorage.getItem('gamePin');
            const storedName = localStorage.getItem('playerName');
            const storedHost = localStorage.getItem('isHost') === 'true';

            if (storedPin && storedName) {
                console.log("🔁 Attempting rejoin:", storedPin, storedName, storedHost);
                this.socket.emit('rejoin_game', {
                    game_pin: storedPin,
                    player_name: storedName,
                    is_host: storedHost
                });
            }
        });

        this.socket.on('disconnect', () => {
            console.warn('❌ Disconnected from server');
        });

        // Standard events
        this.socket.on('game_created', (data) => this.handleGameCreated(data));
        this.socket.on('join_success', (data) => this.handleJoinSuccess(data));
        this.socket.on('join_error', (data) => alert(data.message));
        this.socket.on('player_joined', (data) => this.updatePlayersList(data.players));
        this.socket.on('game_started', () => this.handleGameStarted());
        this.socket.on('new_question', (data) => this.handleNewQuestion(data));
        this.socket.on('answer_received', (data) => this.handleAnswerReceived(data));
        this.socket.on('game_finished', (data) => this.handleGameFinished(data));
        this.socket.on('host_disconnected', (data) => alert(data.message || 'Host disconnected'));
    }

    loadStoredData() {
        this.playerName = localStorage.getItem('playerName') || '';
        this.isHost = localStorage.getItem('isHost') === 'true';
        this.gamePin = localStorage.getItem('gamePin') || '';
    }

    storeData() {
        localStorage.setItem('playerName', this.playerName);
        localStorage.setItem('isHost', this.isHost.toString());
        localStorage.setItem('gamePin', this.gamePin);
    }

    handleGameCreated(data) {
        this.gamePin = data.game_pin;
        this.isHost = true;
        this.storeData();
        alert(`Game Created! PIN: ${this.gamePin}`);
    }

    handleJoinSuccess(data) {
        this.gamePin = data.game_pin;
        this.storeData();
        alert("Joined game successfully!");
    }

    handleGameStarted() {
        alert('Game starting...');
        window.location.href = `/game/${this.gamePin}`;
    }

    handleNewQuestion(data) {
        console.log("🧠 New Question Received:", data);
        this.currentQuestion = data;
        document.getElementById('question-text').textContent = data.question;
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        data.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.textContent = opt;
            btn.className = 'option-button';
            btn.onclick = () => this.submitAnswer(i);
            optionsContainer.appendChild(btn);
        });
    }

    submitAnswer(i) {
        this.socket.emit('submit_answer', { answer: i });
    }

    handleAnswerReceived(data) {
        console.log("✅ Answer result:", data);
    }

    handleGameFinished(data) {
        console.log("🏁 Game finished:", data);
        alert('Game over!');
        window.location.href = `/leaderboard/${this.gamePin}`;
    }

    updatePlayersList(players) {
        console.log("👥 Player list:", players);
    }

    createGame(hostName) {
        this.playerName = hostName;
        this.isHost = true;
        this.socket.emit('create_game', { host_name: hostName });
        this.storeData();
    }

    joinGame(playerName, pin) {
        this.playerName = playerName;
        this.isHost = false;
        this.gamePin = pin;
        this.storeData();
        this.socket.emit('join_game', { player_name: playerName, game_pin: pin });
    }

    addQuestion(q) {
        this.socket.emit('add_question', q);
    }

    startGame() {
        this.socket.emit('start_game');
    }

    nextQuestion() {
        this.socket.emit('next_question');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.quizNova = new QuizNovaClient();
});
