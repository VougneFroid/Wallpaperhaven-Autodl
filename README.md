<div align="center">
  <h1>🌌 Wallhaven Downloader</h1>
  <p><strong>A beautiful, local web application to browse and mass-download wallpapers from Wallhaven while automatically respecting API limits.</strong></p>
  
  [![Python Version](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![UI: Glassmorphism](https://img.shields.io/badge/UI-Glassmorphism-ff69b4.svg)](#)
</div>

---

## 📖 Table of Contents
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Configuration](#️-configuration)
- [🛠️ How It Works](#️-how-it-works)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

* **Premium User Interface:** Experience a sleek, modern dark mode aesthetic featuring glassmorphism overlays, smooth hover animations, and a responsive CSS masonry grid.
* **Smart Search & Sort:** Query wallpapers by keyword and sort by Relevance, Latest, Top List, or Random. Infinite scrolling allows for seamless browsing.
* **Multi-Select & Bulk Download:** Click to select multiple wallpapers, adding them to a floating download queue. Download them all locally with a single click.
* **Visual Download History:** Never download the same wallpaper twice! Previously downloaded wallpapers prominently feature a sleek green `DOWNLOADED` badge while browsing.
* **Native Folder Picker:** Set your custom download directory via the Settings tab. It uses your native Linux file explorer (`kdialog`) to let you visually select your preferred destination folder.
* **Auto-Rate Limiting:** Wallhaven restricts users to 45 requests per minute. The backend automatically throttles your batch downloads in the background so you never get blocked.
* **Zero Dependencies:** The backend runs entirely on Python's standard library. No `pip install`, `Node.js`, or complex setup required!

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** installed on your system.
- `kdialog` installed (standard on KDE Plasma) for the native folder picker feature to work.

### Installation & Running

1. **Clone or navigate to the repository:**
   ```bash
   cd /home/von/Documents/code/wallpaperhaven_autodl
   ```

2. **Start the local server:**
   ```bash
   python3 server.py
   ```

3. **Open the App:**
   Navigate your web browser to [http://localhost:8000](http://localhost:8000).

---

## ⚙️ Configuration

### 1. Setting the Download Directory
By default, wallpapers are saved to a `downloads/` folder inside the project directory. 
- Click the **Gear Icon** ⚙️ next to the Search button.
- Click **Browse** to open your native file explorer and choose a new destination folder.
- Click **Save Settings**. (Your choice is persisted in `settings.json`).

### 2. Adding your Wallhaven API Key (Optional)
To search for SFW/NSFW content or bypass guest search limits, add your free Wallhaven API key.
1. Get your API key from your [Wallhaven Account Settings](https://wallhaven.cc/settings/account).
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit the `.env` file and insert your key:
   ```env
   API_KEY=your_api_key_here
   ```
4. **Restart the Python server** to apply the changes.

---

## 🛠️ How It Works

This project uses a lightweight two-tier architecture:
- **Frontend (`public/`):** Built with Vanilla JS, HTML, and CSS. Handles the dynamic UI, multi-selection state, intersection observers for infinite scrolling, and API requests to the local backend.
- **Backend (`server.py`):** Uses Python's built-in `http.server`. It acts as a secure proxy to the Wallhaven API (handling CORS and hiding your API key), dynamically manages rate-limiting queues, tracks download history (`history.json`), and interfaces with the OS to select directories and save files locally.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! 
Feel free to check out the [issues page](#) to see if there is anything you can help with.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🙏 Acknowledgments & Credits

* **[Wallhaven.cc](https://wallhaven.cc)** - The absolute core of this project. A massive thank you to the Wallhaven team for maintaining the best wallpaper community on the internet and providing the free, public API that powers this downloader.
* Built with the assistance of **Google Antigravity**.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

<div align="center">
  <i>Built with ❤️ for Wallpaper Enthusiasts.</i>
</div>
