# 📊 BigQuery Release Notes Viewer

A sleek, premium web application built to parse, track, and filter real-time Google Cloud BigQuery release updates. This tool aggregates data directly from the official Google Cloud RSS feed, transforming raw XML entries into a scannable, interactive, and category-driven dark-mode dashboard.

---

## 📸 Screenshots
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/aa014ef7-a05a-4f1b-8af2-1f555bbce193" />


<img width="1920" height="16056" alt="image" src="https://github.com/user-attachments/assets/9a59bfa2-4dd2-41af-a672-595ad936e10b" />


### Dashboard Overview
![Dashboard Overview](path/to/your/image_4a7704.jpg)
*Real-time metrics tracking and the premium glassmorphic UI layout.*

### Deep Timeline Stream
![Timeline Stream](path/to/your/image_4a741d.jpg)
*Full-length feed layout with category-specific gradient borders.*

---

## ✨ Features

* **Real-Time Data Aggregation:** Automatically fetches and parses live update categories (`Feature`, `Announcement`, `Change`, `Issue`, `Breaking`) via the Google Cloud BigQuery RSS feed.
* **Interactive Metric Dashboard:** Dynamic UI counters tracking total updates alongside specific individual category counts.
* **Smart Filtering & Global Search:** Instantly narrow down release notes using interactive category chips or full-text query matching.
* **Premium Glassmorphic Design:** A modern dark-mode interface styled with glowing background ambient orbs, smooth hover transitions, and clean timeline elements.
* **Social Media Integration:** Built-in X/Twitter text composer modal with a real-time radial progress character limit tracker (accurately matching `t.co` 23-character URL wrappers).

---

## 🛠️ Project Architecture

```text
├── app.py                # Backend Flask server handling RSS fetching, parsing, and JSON API routing
├── static/
│   ├── css/style.css     # Glassmorphic UI design system styles & animations
│   └── js/app.js         # Frontend engine handling live search, tab filters, and character counters
└── templates/
    └── index.html        # Clean, responsive HTML5 layout using semantic tags

🧰 Tech Stack
Backend: Python, Flask

Frontend: Vanilla JavaScript (ES6+), HTML5, CSS3 Custom Properties

Design Pattern: Glassmorphic Dark Mode

Data Sources: Google Cloud BigQuery Release Notes XML Feed
