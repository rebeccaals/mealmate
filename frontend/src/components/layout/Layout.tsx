import { Outlet, NavLink } from 'react-router-dom'
import { BookOpen, CalendarDays, ShoppingCart, LogOut } from 'lucide-react'
import { useAppDispatch } from '@/app/hooks'
import { logout } from '@/features/auth/authSlice'

export default function Layout() {
  const dispatch = useAppDispatch()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between">
        <span className="font-semibold text-lg">mealmate</span>
        <button
          onClick={() => dispatch(logout())}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </header>

      <main className="flex-1 p-4">
        <Outlet />
      </main>

      <nav className="border-t bg-card safe-area-bottom">
        <div className="flex justify-around py-2">
          <NavLink
            to="/recipes"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <BookOpen size={20} />
            Recipes
          </NavLink>
          <NavLink
            to="/menu"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <CalendarDays size={20} />
            Menu
          </NavLink>
          <NavLink
            to="/shopping"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 text-xs transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <ShoppingCart size={20} />
            Shopping
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
