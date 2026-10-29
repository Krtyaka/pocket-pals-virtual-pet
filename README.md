# 🐾 Pocket Pals — Virtual Pet Companion

**Pocket Pals** is a cute, interactive virtual pet experience built during the **Web Dev Sprint at SAVISKAR 2026, CGC University Mohali**. Our four-member team, **Stack Storm**, developed the project in a two-hour hackathon sprint.

Care for your virtual companion, play mini-games, earn rewards, unlock new friends, and customise your pet — all in a lively interface powered by vanilla web technologies.

## ✨ Features

### 🐱 Virtual pet care
- Feed your pet and manage hunger, happiness, and energy.
- Let your pet sleep and wake up.
- Pet moods and expressions respond to its current stats.
- Stats change over time, including while the page is closed.

### 🎨 Animated characters and customisation
- Three pet species: **Mochi the cat**, **Clover the bunny**, and **Biscuit the bear**.
- Original SVG-based character artwork generated from a shared pet rig.
- CSS animations for idle movement, blinking, tail swaying, chewing, jumping, and mood changes.
- Unlockable accessories, including hats, glasses, bows, and scarves.
- Give your companion a custom name.

### 🎮 Gamification and mini-games
- Earn coins and XP through interactions.
- Level up and work towards goals and achievements.
- Unlock additional companions and purchase accessories.
- Play **Falling Stars** and **Memory Match** mini-games.
- Track progress towards in-game goals.

### 💾 Progress and feedback
- Uses browser `localStorage` to preserve pet stats and game progress across refreshes.
- Generates sound effects with the Web Audio API.
- View activity feedback and create a pet card to download or share.

## 🧰 Tech Stack

- **HTML5** — page structure
- **CSS3** — responsive interface, visual styling, and keyframe animations
- **Vanilla JavaScript** — game logic, interactions, state, rewards, and mini-games
- **SVG** — custom pet artwork and accessory layers
- **localStorage** — browser-side persistence
- **Web Audio API** — procedural sound effects

No game engine or ready-made pet template is used.

## 🚀 Run Locally

Pocket Pals is a static web project and does not require a backend or package installation.

1. Download or clone this repository.
2. Keep all five project files in the same directory.
3. Open `index.html` in a browser.

For a local development server, you can use the **Live Server** extension in Visual Studio Code, then open the local URL it provides.

## 📁 Project Structure

```text
pocket-pals-virtual-pet/
├── index.html   # Main page structure and interface elements
├── styles.css   # Layout, colours, responsive UI, and visual effects
├── pet.css      # Pet expressions and animation system
├── pets.js      # Pet species data and SVG character generation
├── app.js       # State, interactions, rewards, mini-games, and persistence
└── README.md    # Project documentation
```

## 🕹️ How to Play

1. Open the website and meet your companion.
2. Use **Feed**, **Play**, and **Sleep** to care for your pet.
3. Watch its mood and stats change in response to your actions and elapsed time.
4. Earn coins and XP, complete goals, and level up.
5. Open **Collection** to manage companions, name your pet, customise its appearance, and explore goals.
6. Try the mini-games to collect rewards.
7. Refresh the page to see your saved progress restored.

## 🏆 Built at SAVISKAR 2026

Pocket Pals was created for the **Virtual Pet Companion** challenge during the Web Dev Sprint at **SAVISKAR 2026, CGC University Mohali**. The challenge called for a virtual pet with feeding and playing interactions, changing mood and hunger, animations, and state persistence across refreshes.

Our team, **Stack Storm**, secured **third place**. Building within a two-hour time limit was a great exercise in rapid prototyping, prioritising functionality, and creating an engaging experience with HTML, CSS, and JavaScript.

## 🔮 Future Improvements

We'd love to keep evolving Pocket Pals with:
- More pet species, animations, and customisation options
- Additional mini-games and challenges
- More achievements and progression mechanics
- Further accessibility, mobile, and performance refinements

## 👥 Team

**Stack Storm** — four-member team at SAVISKAR 2026.

_Add teammate names and profile links here if everyone is happy to be credited._

## 📸 Screenshots

Add screenshots or a short GIF of the running project here. For example, create a `screenshots/` folder and add images, then embed them like this:

```md
![Pocket Pals gameplay](screenshots/pocket-pals-home.png)
```

## 📄 License

No license has been specified yet. If you want others to reuse or modify the code, choose and add an appropriate open-source license before publishing.
