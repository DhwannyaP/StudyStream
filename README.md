<div align="center">

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    ███████╗████████╗██╗   ██╗██████╗ ██╗   ██╗           ║
║    ██╔════╝╚══██╔══╝██║   ██║██╔══██╗╚██╗ ██╔╝           ║
║    ███████╗   ██║   ██║   ██║██║  ██║ ╚████╔╝            ║
║    ╚════██║   ██║   ██║   ██║██║  ██║  ╚██╔╝             ║
║    ███████║   ██║   ╚██████╔╝██████╔╝   ██║              ║
║    ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝    ╚═╝              ║
║                                                           ║
║           S T R E A M                                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### *Breaking the traditional teacher-centric learning model*
### *through real-time peer-to-peer collaboration*

<br/>

[![WebRTC](https://img.shields.io/badge/⚡_WebRTC-Powered-FF6B35?style=for-the-badge&labelColor=1a1a2e)](https://webrtc.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black&labelColor=1a1a2e)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-68A063?style=for-the-badge&logo=nodedotjs&logoColor=white&labelColor=1a1a2e)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white&labelColor=1a1a2e)](https://mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socketdotio&logoColor=white&labelColor=1a1a2e)](https://socket.io/)
[![License](https://img.shields.io/badge/License-MIT-F7DF1E?style=for-the-badge&labelColor=1a1a2e)](LICENSE)

<br/>

[![Stars](https://img.shields.io/github/stars/yourusername/studystream?style=social)](https://github.com/yourusername/studystream)
[![Forks](https://img.shields.io/github/forks/yourusername/studystream?style=social)](https://github.com/yourusername/studystream)

</div>

---

<br/>

## 🌐 What is StudyStream?

> **StudyStream** is a next-generation collaborative learning platform that replaces centralized, teacher-driven infrastructure with a **WebRTC-powered, decentralized peer-to-peer architecture** — enabling students to connect, collaborate, and learn *directly* with each other, in real time.

Traditional Learning Management Systems funnel all interaction through central servers and instructor-gated content. StudyStream tears that model apart.

Instead, it brings:

| 🔴 Traditional LMS | 🟢 StudyStream |
|---|---|
| Centralized media servers | Peer-to-peer WebRTC streams |
| Passive content consumption | Live collaborative sessions |
| Teacher-gated interaction | Student-driven study rooms |
| No live awareness | Real-time presence indicators |
| Static resources | Annotatable shared documents |

<br/>

---

## ✨ Core Features

<br/>

### 🎥 Real-Time Peer Study Sessions
> *Students don't just watch — they collaborate.*

- Peer-to-peer **audio & video conferencing** via WebRTC
- **DataChannel** for ultra-low-latency text/data exchange
- Live shared interaction — **no media relayed through central server**
- STUN/TURN fallback for NAT traversal

<br/>

### 📄 Collaborative Resource Viewer
> *Shared documents become interactive learning spaces.*

- Teachers upload **PDFs, PowerPoint slides, images, and notes**
- Students can:
  - 🖊️ **Annotate** and highlight directly on documents
  - 🔴 Use the **laser pointer** tool for live guidance
  - 📄 **Sync page navigation** across all participants
- Real-time collaborative viewing — everyone sees the same thing, live

<br/>

### 👥 Live Presence Awareness
> *See exactly who's studying what, right now.*

- Live indicators showing **which students are viewing the same resource**
- Collaboration cues similar to modern tools like Google Docs or Notion
- Encourages spontaneous, organic peer study

<br/>

### 💬 AI-Moderated Chat
> *Safe academic spaces, automatically maintained.*

- Integrated study-room chat with:
  - 🤖 **Toxicity detection**
  - 🚫 **Profanity filtering**
  - 🚩 **Automated moderation flags**
- Keeps study sessions focused, respectful, and productive

<br/>

### 📊 Teacher Analytics Dashboard
> *Data-driven insight into how students actually learn.*

- Tracks **student activity** and session participation
- Measures **collaborative engagement** per resource
- Surfaces patterns to help educators optimise content delivery

<br/>

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                        │
│          Student UI  ◄──────────────►  Teacher UI          │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                  COLLABORATION LAYER                        │
│    💬 Chat  │  📄 Shared Resources  │  🖊️ Annotations       │
│             │  📊 Analytics         │  👥 Presence          │
└──────────────────────────┬─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                  CONNECTIVITY LAYER                         │
│   ⚡ WebRTC P2P  │  🔀 STUN/TURN  │  🔒 Secure RTP          │
│   📡 Socket.IO Signaling Server                            │
└────────────────────────────────────────────────────────────┘
```

**WebRTC Signaling Flow:**

```
Peer A ──[Offer SDP]──► Signaling Server ──[Offer SDP]──► Peer B
Peer A ◄─[Answer SDP]── Signaling Server ◄─[Answer SDP]── Peer B
Peer A ◄════════════ Direct P2P Connection ════════════► Peer B
```

<br/>

---

## ⚙️ Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| **Frontend** | React · Vite · WebRTC APIs · TypeScript |
| **Backend** | Node.js · Express · Socket.IO |
| **Database** | MongoDB · MongoDB Atlas |
| **Realtime** | WebRTC · STUN/TURN · Secure RTP |
| **Deployment** | Vercel (Frontend) · Render (Backend) |
| **Tooling** | Docker · Git |

</div>

<br/>

<div align="center">
  <img src="https://skillicons.dev/icons?i=react,nodejs,express,mongodb,ts,vercel,git,docker&theme=dark" />
</div>

<br/>

---

## 🖥️ Platform Preview

### 📚 Teacher Resource Upload
<img src="docs/screenshots/upload.png" width="800" alt="Teacher Resource Upload Interface"/>

<br/>

### 📊 Teacher Analytics Dashboard
<img src="docs/screenshots/analytics.png" width="800" alt="Analytics Dashboard"/>

<br/>

### 👥 Study Group Activity Feed
<img src="docs/screenshots/activity.png" width="800" alt="Study Group Activity"/>

<br/>

---

## 🚀 Getting Started

### Prerequisites

```bash
node >= 18.x
npm >= 9.x
MongoDB instance (local or Atlas)
```

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/studystream.git
cd studystream
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your MongoDB URI, STUN/TURN credentials, etc.
```

### 4. Run Development Server

```bash
npm run dev
```

> 🟢 Frontend: `http://localhost:5173`
> 🟢 Backend:  `http://localhost:3000`

<br/>

---

## 🌐 Deployment

| Component | Platform | Status |
|---|---|---|
| 🌍 Frontend | Vercel | [![Vercel](https://img.shields.io/badge/Live-black?logo=vercel)](https://studystream.vercel.app) |
| ⚙️ Backend | Render | [![Render](https://img.shields.io/badge/Live-46E3B7?logo=render&logoColor=black)](https://render.com) |
| 🗄️ Database | MongoDB Atlas | [![Atlas](https://img.shields.io/badge/Connected-47A248?logo=mongodb&logoColor=white)](https://mongodb.com/atlas) |

<br/>

---

## 🔬 Research Contribution

> This platform is developed in parallel with the academic research study:

<div align="center">

### *"Enabling Peer-to-Peer Collaboration in Online Study Platforms:*
### *A WebRTC-Driven Approach"*

</div>

The research explores how **decentralized communication architectures** can support student-driven learning environments, reduce infrastructure costs, and improve collaborative outcomes compared to traditional LMS platforms.

<br/>

---

## 📈 Roadmap

```
✅ Phase 1 — P2P Study Rooms (WebRTC)
✅ Phase 2 — Collaborative Resource Viewer
✅ Phase 3 — AI Chat Moderation
✅ Phase 4 — Teacher Analytics Dashboard

🔲 Phase 5 — SFU integration for large groups (50+ students)
🔲 Phase 6 — Persistent collaborative whiteboards
🔲 Phase 7 — LMS integrations (Moodle, Canvas)
🔲 Phase 8 — Improved AI moderation models
🔲 Phase 9 — Cross-institution collaboration
```

<br/>

---

## 🤝 Contributors

<div align="center">

| Name | Role |
|---|---|
| 👨‍💻 **Sahil Deore** | Developer |
| 👩‍💻 **Dhwannya Pachupate** | Developer |
| 👨‍💻 **Shivam Suryawanshi** | Developer |
| 🎓 **Dr. Swati Nadkarni** | Research Guide |
| 🎓 **Dr. Rashmi Malvankar** | Research Guide |
| 🎓 **Dr. Vinit Kotak** | Research Guide |

</div>

<br/>

---

<div align="center">

### ⭐ If StudyStream resonates with you — *give it a star.*

*It helps this project reach more developers, researchers, and educators.*

<br/>

[![Star this repo](https://img.shields.io/badge/⭐_Star_This_Repo-FF6B35?style=for-the-badge&labelColor=1a1a2e)](https://github.com/yourusername/studystream)
[![Fork this repo](https://img.shields.io/badge/🍴_Fork_It-61DAFB?style=for-the-badge&labelColor=1a1a2e)](https://github.com/yourusername/studystream/fork)
[![Open an issue](https://img.shields.io/badge/🐛_Report_Bug-FF4757?style=for-the-badge&labelColor=1a1a2e)](https://github.com/yourusername/studystream/issues)

<br/>

```
Built with ❤️ for students, by students.
```

📜 Released under the [MIT License](LICENSE)

</div>
