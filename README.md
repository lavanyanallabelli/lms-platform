# 📚 LMS AI Study Assistant (K–12 Prototype)  

An AI-powered Learning Management System (LMS) designed for **K–12 education**. This prototype integrates AI features to support personalized learning, smart study planning, and teacher–student collaboration in an intuitive, user-friendly platform.  

---

## 🚀 Features  

### 🎓 For Students  
- **Personalized Study Plans** – AI-generated plans based on goals, subjects, and available time.  
- **Progress Tracking** – view lesson completion and quiz performance over time.  
- **AI Study Assistant** – ask study questions or upload PDFs to extract summaries, definitions, and keynotes.  
- **Quizzes & Feedback** – take interactive quizzes, with AI-assisted grading and instant feedback.  
- **Notes & Study Materials** – save key notes and revisit anytime.  

### 👩‍🏫 For Teachers (future roadmap)  
- Create and manage courses (Math, Chemistry, etc.).  
- Assign lessons and quizzes.  
- Review student progress and study plans.  

### 🛠️ General Platform  
- Clean, minimal UI with responsive design.  
- Role-based authentication (Firebase Auth).  
- Firestore database for secure and isolated user data.  
- AI integration via OpenAI for Q&A, plan generation, and content analysis.  

---

## 🧑‍💻 Tech Stack  

- **Frontend:** React 18, React Router 6, Tailwind CSS  
- **Backend / Database:** Firebase (Auth, Firestore, Hosting)  
- **AI Integration:** OpenAI API  
- **Deployment:** Firebase Hosting  

---


## ⚙️ Setup & Installation  

1. **Clone the repo**  
   ```bash
   git clone https://github.com/your-username/lms-platform
   cd lms-platform
   ```

2. **Install dependencies**  
   ```bash
   npm install
   ```

3. **Set up environment variables**  
   Create a `.env` file in the root with:  
   ```
   REACT_APP_OPENAI_API_KEY=your-openai-api-key
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
   ```

4. **Run the app**  
   ```bash
   npm start
   ```

5. **Deploy to Firebase (optional)**  
   ```bash
   firebase deploy
   ```

---

## 📊 Roadmap  

- ✅ MVP: Courses, lessons, quizzes, AI assistant, PDF analysis, study plans  
- 🔄 v1.1: Real-time PDF parsing and citation extraction  
- 🔄 v1.2: Teacher dashboards and class-wide analytics  
- 🔄 v1.3: AI-powered recommendations and advanced progress analytics  

---

## 👩‍💻 Author  

**Lavanya Nallabelli**  
- 🌐 [LinkedIn](https://www.linkedin.com/in/lavanya-nallabelli/)   
