import NovelsPage      from './pages/NovelsPage'
import CategoriesPage  from './pages/CategoriesPage'
import RankingPage     from './pages/RankingPage'
import AuthorsPage     from './pages/AuthorsPage'
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import { supabase, getUserRole } from './lib/supabase'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NotFoundPage from './pages/NotFoundPage'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import NovelGrid from './components/NovelGrid'
import Categories from './components/Categories'
import Ranking from './components/Ranking'
import Footer from './components/Footer'
import NovelPage from './pages/NovelPage'
import ProfilePage from './pages/ProfilePage'
import CoinPage from './pages/CoinPage'
import AdminLayout from './pages/admin/AdminLayout'
import DashboardPage from './pages/admin/DashboardPage'
import NovelsAdmin from './pages/admin/NovelsAdmin'
import ChaptersAdmin from './pages/admin/ChaptersAdmin'
import WritersAdmin from './pages/admin/WritersAdmin'
import UsersAdmin from './pages/admin/UsersAdmin'
import CategoriesAdmin from './pages/admin/CategoriesAdmin'
import CommentsAdmin from './pages/admin/CommentsAdmin'
import DuplicateCheckAdmin from './pages/admin/DuplicateCheckAdmin'
import AnnouncementsAdmin from './pages/admin/AnnouncementsAdmin'
import AnnouncementBanner from './components/AnnouncementBanner'

function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <NovelGrid />
        <Categories />
        <Ranking />
        <section className="cta-section">
          <p className="cta-label">เปิดรับนักเขียนหน้าใหม่</p>
          <h2>ปลดปล่อยจินตนาการของคุณ</h2>
          <p>สมัครเป็นนักเขียน STAR NOVEL วันนี้ — ลงนิยาย อัปโหลดเสียง ดูสถิติ และรับรายได้จากระบบ Coin แบบเรียลไทม์</p>
          <button className="btn-primary">สมัครนักเขียน</button>
          <div className="cta-stats">
            <div><strong>70%</strong><span>ส่วนแบ่งรายได้</span></div>
            <div><strong>ฟรี</strong><span>ค่าธรรมเนียม</span></div>
            <div><strong>24/7</strong><span>ทีมซัพพอร์ต</span></div>
            <div><strong>Realtime</strong><span>Dashboard</span></div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 3000)

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          const r = await Promise.race([
            getUserRole(),
            new Promise((resolve) => setTimeout(() => resolve(null), 2000))
          ])
          setRole(r)
        } catch {
          setRole(null)
        }
      }
      clearTimeout(timeout)
      setLoading(false)
    }).catch(() => {
      clearTimeout(timeout)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          const r = await Promise.race([
            getUserRole(),
            new Promise((resolve) => setTimeout(() => resolve(null), 2000))
          ])
          setRole(r)
        } catch {
          setRole(null)
        }
      } else {
        setRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null

  return (
    <>
      <AnnouncementBanner />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/novel/:id" element={<NovelPage />} />
        <Route path="/search" element={<NovelPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/novels"       element={<NovelsPage />} />
        <Route path="/audio-novels" element={<Navigate to="/novels?tab=audio" replace />} />
        <Route path="/categories"   element={<CategoriesPage />} />
        <Route path="/ranking"      element={<RankingPage />} />
        <Route path="/authors"      element={<AuthorsPage />} />
        <Route path="/profile" element={
          user ? <ProfilePage /> : <Navigate to="/login" replace />
        } />
        <Route path="/coin" element={
          user ? <CoinPage /> : <Navigate to="/login" replace />
        } />
        <Route path="/coins" element={
          user ? <CoinPage /> : <Navigate to="/login" replace />
        } />
        <Route path="/login" element={
          user ? <Navigate to="/" replace /> : <LoginPage />
        } />

        <Route path="/admin" element={
          !user
            ? <Navigate to="/login" replace />
            : role === null
            ? null
            : role !== 'owner'
            ? <Navigate to="/" replace />
            : <AdminLayout />
        }>
          <Route index element={<DashboardPage />} />
          <Route path="novels" element={<NovelsAdmin />} />
          <Route path="chapters" element={<ChaptersAdmin />} />
          <Route path="writers" element={<WritersAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
          <Route path="categories" element={<CategoriesAdmin />} />
          <Route path="comments" element={<CommentsAdmin />} />
          <Route path="duplicate-check" element={<DuplicateCheckAdmin />} />
          <Route path="announcements" element={<AnnouncementsAdmin />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
