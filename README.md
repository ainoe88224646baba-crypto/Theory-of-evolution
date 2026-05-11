# Theory of Evolution (进化论) 🧬

An engaging evolution simulation game where you guide a creature through its evolutionary journey.

## 🎮 Overview

"Theory of Evolution" is an interactive web-based game where players experience the journey of evolution. Explore your surroundings, gather resources, and evolve your creature through different stages of life in a dynamic environment.

## ✨ Features

- **Evolution System:** Collect resources to trigger mutations and evolve into higher life forms.
- **Dynamic Gameplay:** Navigate the environment, find food, and survive against challenges.
- **Visual Effects:** Engaging particle effects and animations to bring the evolutionary stages to life.

## 📁 Project Structure

```text
├── game/
│   ├── index.html             # Main entry point of the game
│   ├── evolution-system.js    # Core logic for creature evolution
│   └── assets/
│       ├── css/               # Stylesheets
│       └── js/
│           ├── gameEngine.js  # Main game loop
│           ├── evolutionData.js # Data structures for evolution stages
│           ├── player.js      # Player movement and controls
│           ├── resources.js   # Resource generation and management
│           ├── particles.js   # Particle system for visual effects
│           └── ui.js          # User Interface management
```

## 🚀 How to Run Locally

You can run this game simply by serving the files through a local web server, or directly opening `index.html` in your browser (depending on browser security policies).

1. Clone the repository:
   ```bash
   git clone https://github.com/ainoe88224646baba-crypto/Theory-of-evolution.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Theory-of-evolution
   ```
3. Open `game/index.html` in your favorite web browser.
   - *Alternatively, start a local server if you encounter CORS issues loading local modules:*
     ```bash
     npx http-server
     # or
     python -m http.server
     ```

## 🛠️ Technologies Used

- HTML5 / CSS3 / JavaScript (ES6)

## 📜 License

This project is open-source and available under the MIT License.
