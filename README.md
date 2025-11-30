# 🚒 大埔救急 Save TaiPo - 確保每份民間力量都用得其所

一個為大埔宏福苑五級火災緊急救援同整合物資狀態而設嘅平臺。
This is a community-driven disaster relief coordination platform built to consolidate supplies udates and real-time information for the Tai Po Wang Fuk Court Fire Incident.

---

## 點解要整呢個App？ Why built this app?

2025年11月，大埔宏福苑嘅火，奪走無數人命，近2000戶街坊一夜之間無家可歸。當時救援消息滿佈TG group同social media，令到物資分配唔平均，重複送貨同交通擠塞問題都好嚴重。

令人感動又心酸嘅係，香港人嘅愛唔夠兩日已經塞爆物資站，有人po：「啲水夠我飲成世，啲沐浴露沖涼沖一年，啲香蕉餵俾黑猩猩都嫌多」。呢句說話，反映咗香港人一呼百應嘅愛，但亦揭示咗資訊不對稱造成嘅資源錯配，物資喺某一邊堆積如山，而另一邊就空空如也​​。

為咗令社區更有效率咁協調支援，整咗呢個平臺，將散落嘅資訊統一同可視化，變成real-time map + dashboard。資源能夠更快、更合理咁分配，流向真正需要嘅地方。
    
In November 2025, the Tai Po Wang Fuk Court fire caused major local disruption. Information was fragmented across Telegram groups and other social media which resulted in misallocated supplies, road congestion, and volunteers missing opportunities to help. This app is built to consolidate and visualize station status on maps, and provide task coordination so community resources can be used efficiently.

---

## 功能概覽 App Features

1. 物資站管理 Station Management
  - 用戶可以瀏覽、建立、編輯同管理物資站嘅資料（地址、聯絡、庫存狀態等），確保最updated嘅資訊可以即時傳達畀災民同義工
  - Users can view, create, and manage stations (address, contact, stock status, etc.)

2. 供求配對 / Needs & Offerings
  - 義工可以mark低一個物資站需要或者提供嘅物資（例如水、毛毯），以便其他人知道邊度缺貨、邊度有資源，減少錯配。災民亦都可以filter自己所需嘅資源同埋用地圖，顯示所有站點、狀態同距離去搵物資站
  - Volunteers can mark supplies needed or offered at each station, such as water, blankets, etc. Resident can use the map and filter by the type of support they need to find stations

2. 任務協調 Task Coordination
  - 車手可以睇附近嘅運輸任務、一鍵接單並完成運送；Admin可以建立任務去將物資喺唔同嘅站點之間運送。
  - Drivers can find, claim, and complete transport tasks. Station managers can create tasks for transport/logistics.

3. 即時警報 Real-time Alerts
  - 廣東話：管理員或授權人員可以廣播全站嘅即時警報（例如「緊急撤離」、「暫停接收物資」），即時通知所有用戶重要消息。
  - Admins can broadcast real-time alerts to all users.

4. 用戶權限 Roles & Permissions
  - 支援多個角色（居民、義工、車手、站長、Admin）同各自功能限制。
  - Supports roles such as Resident, Volunteer, Driver, Station Manager, and Admin, each with permissions appropriate to their role.

5. 收藏與評分 Favorites & Upvote/Downvote
  - 用戶可以收藏站點，為站點評分（e.g., 支援程度），report錯誤或不准確資訊。
  - Users can save favorites, upvote/downvote station status and flag inaccuracies.

---

## 未來功能 Future Roadmap

- 短期 (Next 1–2 months)
  - 改善資料同步同表單驗證 Improved Data Sync & Validation
  - 完成義工同車手任務分派系統 Finish Volunteer & Driver Dispatch System
  - 離線瀏覽 (PWA)：斷網時仍可查看最後更新的地圖同重要公告 Offline Browsing (PWA)
  - 「大聲公」語音廣播，幫唔識字嘅公公婆婆聽資訊 TTS Broadcast for Elderlies

- 中期 (3–6 months)
  - 更完善嘅任務分派系統（多段轉運、路線建議）、義工排班 Advanced Task Systen & Shift Scheduling
  - 資料分析同視覺化報表（熱點、資源分布） Data Analytics & Visualization
  - 同政府、慈善機構或其他救援平台 API 整合 API Integration with External Platforms

- 長期 (6+ months)
  - AI推薦系統（依據需求推薦物資站、車手、路線等）AI Recommendation System for stations, drivers, and optimal routes
  - 按飲食需求篩（清真、素食、糖尿餐或流質食物等等）選物資站 Filter stations by Dietary Needs (e.g. Halal, Vegetarian, Diabetic, or Liquid meals)
  - 保險索償懶人包 Insurance Claim Guide
  - 預約義務律師咨詢，處理租約終止、賠償責任等法律問題 Appointment system for free legal consultations
  - 畀街坊留言、點蠟燭，抒發情緒，建立社區連繫  A digital space for residents to leave messages, light virtual candles, and express emotions to rebuild community bonds

---

## Developer Guide

### Techstack
- Frontend: React + Vite + TypeScript 
- Backend: Firebase Functions (Express) + Firestore 
- `firebase.json`、`firestore.rules`、`firestore.indexes.json` — Firebase 配置

### Prerequisites
- Node.js LTS (>= 18, 20 Recommended)
- npm or pnpm
- Firebase CLI (`npm install -g firebase-tools`)

### Environment variables
See `frontend/.env.example` and `backend/README.md`

### Local dev
1. Clone repo & install dependencies:

```bash
git clone https://github.com/gracetyy/save_taipo.git
cd save_taipo
npm --prefix backend install
npm --prefix frontend install
```

2. Start backend with emulators (local development):

```bash
cd backend
npm run serve  # runs Firebase functions with emulator
```

3. Start frontend dev server (connect to local backend or deployed API):

```bash
cd frontend
cp .env.example .env
# edit .env to point VITE_API_URL to local emulator or deployed endpoint
npm run dev
```

Open the site at http://localhost:5173 (Vite default) and use the Firebase Auth emulator or project credentials.

### Deploy
- Only Backend:

```bash
cd backend
firebase deploy --only functions
```

- Only Frontend:

```bash
cd frontend
firebase deploy --only hosting
```
- Both:

```bash
firebase deploy
```

---

## 資料來源 Data Sources
- TG Groups、[Google Sheets](https://docs.google.com/spreadsheets/d/1W8A40TCVAY5prHNyVk-TqdSv2EumkVvN9l7LoUrY8-w/edit?gid=0#gid=0)、[Google Map](https://maps.app.goo.gl/2R9hDeekoCPZGVfd9)

---

## 版權及致謝 / License & Acknowledgments
- 本專案採用 MIT License — 詳情請參閱 `LICENSE` 文件。
- 感謝所有消防員、醫療團隊、義工、車手與資料提供者🙏
