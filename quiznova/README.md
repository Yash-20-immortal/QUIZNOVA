# QuizNova - Real-time Multiplayer Quiz Game

A futuristic, real-time multiplayer quiz application built with Python Flask and Socket.IO, featuring a stunning neon-glassmorphic design.

## 🚀 Features

- **Real-time Multiplayer**: Host and join games with live updates
- **Dynamic Quiz Creation**: Hosts can create custom quizzes with multiple choice questions
- **Live Scoring**: Instant scoring with time-based bonuses
- **Futuristic UI**: Neon-glassmorphic design with animated effects
- **Responsive Design**: Works on desktop and mobile devices
- **Live Leaderboard**: Real-time score tracking and rankings

## 🛠️ Tech Stack

- **Backend**: Python Flask + Flask-SocketIO
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Real-time Communication**: Socket.IO
- **Styling**: Custom CSS with glassmorphic effects

## 📁 Project Structure

```
quiznova/
├── app.py                 # Flask application with SocketIO
├── requirements.txt       # Python dependencies
├── static/
│   ├── style.css         # Futuristic CSS styling
│   └── script.js         # Client-side JavaScript
├── templates/
│   ├── index.html        # Home page
│   ├── host.html         # Host game page
│   ├── join.html         # Join game page
│   ├── lobby.html        # Game lobby
│   ├── game.html         # Quiz game interface
│   └── leaderboard.html  # Final results
└── README.md
```

## 🚀 Installation & Setup

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Step 1: Clone or Download

Download the project files to your local machine.

### Step 2: Install Dependencies

Navigate to the project directory and install the required packages:

```bash

pip install -r requirements.txt
```

### Step 3: Run the Application

Start the Flask development server:

```bash
python app.py
```

The application will be available at: `http://localhost:5000`

## 🎮 How to Play

### For Hosts:

1. **Create a Game**
   - Go to the home page and click "Host Game"
   - Enter your name
   - Click "Create Game" to generate a unique 6-digit PIN

2. **Add Questions**
   - Add questions with 4 multiple choice options
   - Select the correct answer (A, B, C, or D)
   - Set time limit for each question (5-120 seconds)
   - Click "Add Question" to add to your quiz

3. **Start the Game**
   - Wait for players to join using your PIN
   - Click "Start Game" when ready
   - Monitor live responses and scores

### For Players:

1. **Join a Game**
   - Go to the home page and click "Join Game"
   - Enter your name and the 6-digit game PIN
   - Click "Join Game"

2. **Play the Quiz**
   - Answer questions in real-time
   - Earn points for correct answers (bonus for speed)
   - See live leaderboard updates

## 🎨 Design Features

- **Neon Glassmorphic UI**: Translucent cards with glowing borders
- **Animated Background**: Moving star field with parallax effects
- **Particle Effects**: Interactive button animations
- **Gradient Text**: Dynamic color-shifting text effects
- **Responsive Layout**: Optimized for all screen sizes
- **Smooth Animations**: CSS transitions and keyframe animations

## 🔧 Configuration

### Server Settings

The application runs on `localhost:5000` by default. To change the host or port, modify the last line in `app.py`:

```python
socketio.run(app, debug=True, host='0.0.0.0', port=5000)
```

### Game Settings

- **Question Time Limit**: 5-120 seconds (configurable per question)
- **Score System**: 100 points base + time bonus (10 points per second remaining)
- **Game PIN**: 6-digit numeric code
- **Max Players**: No limit (handled by server capacity)

## 🐛 Troubleshooting

### Common Issues:

1. **Port Already in Use**
   - Change the port number in `app.py`
   - Or kill the process using port 5000

2. **Socket.IO Connection Issues**
   - Ensure all players are on the same network
   - Check firewall settings
   - Try refreshing the browser

3. **Questions Not Loading**
   - Make sure to add at least one question before starting
   - Check browser console for JavaScript errors

### Browser Compatibility:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🚀 Deployment

### Local Network

To allow other devices on your network to join:

1. Find your computer's IP address
2. Change `host='0.0.0.0'` in `app.py`
3. Run the application
4. Share your IP address with players

### Production Deployment

For production deployment, consider:

- Using a production WSGI server (Gunicorn)
- Setting up a reverse proxy (Nginx)
- Using a proper database (PostgreSQL/MongoDB)
- Implementing SSL/HTTPS
- Adding user authentication

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 🎯 Future Enhancements

- User accounts and authentication
- Question categories and difficulty levels
- Custom themes and avatars
- Tournament mode
- Mobile app version
- Database integration
- Admin dashboard
- Question import/export

---

**Enjoy playing QuizNova! 🎮✨**
