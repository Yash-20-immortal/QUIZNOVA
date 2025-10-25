from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room
import random
import string
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = 'quiznova_secret_key_2024'
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory data stores
games = {}
players = {}


def generate_pin():
    """Generate a unique 6-digit game PIN"""
    while True:
        pin = ''.join(random.choices(string.digits, k=6))
        if pin not in games:
            return pin


# ---------------- ROUTES ---------------- #

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/host')
def host():
    return render_template('host.html')


@app.route('/join')
def join():
    return render_template('join.html')


@app.route('/lobby/<game_pin>')
def lobby(game_pin):
    if game_pin not in games:
        return "Game not found", 404
    return render_template('lobby.html', game_pin=game_pin)


@app.route('/game/<game_pin>')
def game(game_pin):
    if game_pin not in games:
        return "Game not found", 404
    return render_template('game.html', game_pin=game_pin)


@app.route('/leaderboard/<game_pin>')
def leaderboard(game_pin):
    if game_pin not in games:
        return "Game not found", 404
    return render_template('leaderboard.html', game_pin=game_pin)


# ---------------- SOCKET EVENTS ---------------- #

@socketio.on('create_game')
def handle_create_game(data):
    """Host creates a new game"""
    host_name = data.get('host_name', 'Host')
    game_pin = generate_pin()

    games[game_pin] = {
        'host_name': host_name,
        'host_id': request.sid,
        'players': {},
        'questions': [],
        'current_question': 0,
        'game_state': 'waiting',
        'scores': {},
        'question_start_time': None,
        'host_connected': True
    }

    # Add host to players
    games[game_pin]['players'][request.sid] = {
        'name': host_name,
        'is_host': True,
        'score': 0
    }
    games[game_pin]['scores'][host_name] = 0

    players[request.sid] = {
        'name': host_name,
        'game_pin': game_pin,
        'is_host': True
    }

    join_room(game_pin)

    emit('game_created', {'game_pin': game_pin})
    emit('player_joined', {
        'player_name': host_name,
        'is_host': True,
        'players': list(games[game_pin]['players'].values())
    }, room=game_pin)


@socketio.on('join_game')
def handle_join_game(data):
    """Player joins a game"""
    game_pin = data.get('game_pin', '').strip()
    player_name = data.get('player_name', '').strip()

    if not game_pin or not player_name:
        emit('join_error', {'message': 'Game PIN and name are required'})
        return

    if game_pin not in games:
        emit('join_error', {'message': 'Game not found'})
        return

    game = games[game_pin]

    if game['game_state'] != 'waiting':
        emit('join_error', {'message': 'Game already started'})
        return

    existing_names = [p['name'] for p in game['players'].values()]
    if player_name in existing_names:
        emit('join_error', {'message': 'Name already taken'})
        return

    # Add player
    game['players'][request.sid] = {
        'name': player_name,
        'is_host': False,
        'score': 0
    }
    game['scores'][player_name] = 0

    players[request.sid] = {
        'name': player_name,
        'game_pin': game_pin,
        'is_host': False
    }

    join_room(game_pin)

    emit('join_success', {'game_pin': game_pin})
    emit('player_joined', {
        'player_name': player_name,
        'is_host': False,
        'players': list(game['players'].values())
    }, room=game_pin)


@socketio.on('add_question')
def handle_add_question(data):
    """Host adds a question"""
    sid = request.sid
    game_pin = players.get(sid, {}).get('game_pin')
    if not game_pin or not players[sid]['is_host']:
        return

    question = {
        'question': data.get('question', ''),
        'options': data.get('options', []),
        'correct_answer': int(data.get('correct_answer', 0)),
        'time_limit': int(data.get('time_limit', 30))
    }

    games[game_pin]['questions'].append(question)
    emit('question_added', {'question_count': len(games[game_pin]['questions'])}, room=sid)


@socketio.on('start_game')
def handle_start_game():
    """Host starts the game"""
    sid = request.sid
    game_pin = players.get(sid, {}).get('game_pin')
    if not game_pin or not players[sid]['is_host']:
        return

    game = games[game_pin]
    if len(game['questions']) == 0:
        emit('start_error', {'message': 'Add at least one question before starting'}, room=sid)
        return

    game['game_state'] = 'playing'
    game['current_question'] = 0

    emit('game_started', room=game_pin)
    next_question(game_pin)


def next_question(game_pin):
    """Send the next question to all players"""
    if game_pin not in games:
        return

    game = games[game_pin]

    if game['current_question'] >= len(game['questions']):
        game['game_state'] = 'finished'
        socketio.emit('game_finished', {'final_scores': game['scores']}, room=game_pin)
        return

    question = game['questions'][game['current_question']]
    game['question_start_time'] = time.time()

    print(f"📡 Emitting new_question for game {game_pin}: {question}")

    socketio.emit('new_question', {
        'question_number': game['current_question'] + 1,
        'total_questions': len(game['questions']),
        'question': question['question'],
        'options': question['options'],
        'time_limit': question['time_limit'],
        'correct_answer': question['correct_answer']
    }, room=game_pin)


@socketio.on('submit_answer')
def handle_submit_answer(data):
    """Handle player answers"""
    sid = request.sid
    game_pin = players.get(sid, {}).get('game_pin')
    if not game_pin:
        return

    game = games.get(game_pin)
    if not game or game['game_state'] != 'playing':
        return

    q_index = game['current_question']
    if q_index >= len(game['questions']):
        return

    question = game['questions'][q_index]
    answer = int(data.get('answer', -1))
    player_name = players[sid]['name']

    time_left = max(0, question['time_limit'] - (time.time() - game['question_start_time']))
    time_bonus = int(time_left * 10)
    score = 0

    if answer == question['correct_answer']:
        score = 100 + time_bonus
        game['scores'][player_name] += score
        game['players'][sid]['score'] += score

    socketio.emit('answer_received', {
        'player_name': player_name,
        'answer': answer,
        'is_correct': answer == question['correct_answer'],
        'score': game['scores'][player_name]
    }, room=game_pin)


@socketio.on('next_question')
def handle_next_question():
    """Move to next question"""
    sid = request.sid
    game_pin = players.get(sid, {}).get('game_pin')
    if not game_pin or not players[sid]['is_host']:
        return

    games[game_pin]['current_question'] += 1
    next_question(game_pin)


@socketio.on('rejoin_game')
def handle_rejoin_game(data):
    """Handle player/host rejoin after reload or navigation"""
    sid = request.sid
    game_pin = data.get('game_pin')
    player_name = data.get('player_name')
    is_host = data.get('is_host', False)

    if not game_pin or game_pin not in games:
        emit('rejoin_error', {'message': 'Game not found'}, room=sid)
        return

    join_room(game_pin)

    players[sid] = {
        'name': player_name,
        'game_pin': game_pin,
        'is_host': is_host
    }

    game = games[game_pin]
    game['players'][sid] = {
        'name': player_name,
        'is_host': is_host,
        'score': game['scores'].get(player_name, 0)
    }

    if is_host:
        game['host_id'] = sid
        game['host_connected'] = True
        print(f"🔁 Host rejoined game {game_pin}")

    emit('player_joined', {
        'player_name': player_name,
        'is_host': is_host,
        'players': list(game['players'].values())
    }, room=game_pin)

    # Resend question if the game is ongoing
    if game.get('game_state') == 'playing':
        q_index = game['current_question']
        if q_index < len(game['questions']):
            question = game['questions'][q_index]
            emit('new_question', {
                'question_number': q_index + 1,
                'total_questions': len(game['questions']),
                'question': question['question'],
                'options': question['options'],
                'time_limit': question['time_limit'],
                'correct_answer': question['correct_answer']
            }, room=sid)


@socketio.on('disconnect')
def handle_disconnect(sid=None):
    """Handle disconnections gracefully"""
    try:
        current_sid = request.sid if request.sid else sid
        if current_sid not in players:
            return

        player_data = players[current_sid]
        game_pin = player_data['game_pin']
        player_name = player_data['name']
        is_host = player_data['is_host']

        if game_pin in games:
            game = games[game_pin]

            if is_host:
                print(f"⚠️ Host of game {game_pin} disconnected (game preserved).")
                game['host_connected'] = False
                emit('host_disconnected', {'message': 'Host temporarily disconnected...'}, room=game_pin)
            else:
                print(f"👋 Player '{player_name}' disconnected from {game_pin}")
                if current_sid in game['players']:
                    del game['players'][current_sid]
                if player_name in game['scores']:
                    del game['scores'][player_name]
                emit('player_left', {
                    'player_name': player_name,
                    'players': list(game['players'].values())
                }, room=game_pin)

        del players[current_sid]

    except Exception as e:
        print(f"⚠️ Disconnect handler error: {e}")

import os

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port, allow_unsafe_werkzeug=True)
