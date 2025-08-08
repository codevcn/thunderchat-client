import { Home, Rocket, Globe, Sparkles } from "lucide-react"
import Link from "next/link"

export const NotFoundSection = () => {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative flex items-center justify-center">
      {/* Animated background stars */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-20 left-20 animate-float">
        <div className="w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center">
          <Globe className="w-8 h-8 text-white/40 animate-spin-slow" />
        </div>
      </div>

      <div className="absolute top-32 right-32 animate-float-reverse">
        <div className="w-12 h-12 border border-white/20 rounded-full">
          <div className="w-full h-full border-2 border-white/10 rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="absolute bottom-32 left-40 animate-float">
        <Rocket className="w-10 h-10 text-white/30 rotate-45" />
      </div>

      <div className="absolute bottom-40 right-20 animate-bounce-slow">
        <Sparkles className="w-8 h-8 text-white/40" />
      </div>

      <div className="absolute top-40 right-1/4 animate-float-reverse">
        <div className="w-8 h-8 bg-white/10 rounded-full"></div>
      </div>

      <div className="absolute bottom-20 left-1/3 animate-float">
        <div className="w-6 h-6 border border-white/20 rounded-full"></div>
      </div>

      {/* Main content */}
      <div className="text-center z-10 px-8">
        {/* Large 404 text */}
        <div className="relative mb-8">
          <h1 className="text-[8rem] md:text-[12rem] lg:text-[14rem] font-bold leading-none tracking-wider">
            4<span className="inline-block animate-pulse mx-2">0</span>4
          </h1>
          <div className="absolute inset-0 text-[8rem] md:text-[12rem] lg:text-[14rem] font-bold leading-none tracking-wider text-white/10 blur-sm">
            404
          </div>
        </div>

        {/* Error message */}
        <div className="mb-8 space-y-2">
          <h2 className="text-2xl md:text-3xl font-semibold tracking-wide">Page not found</h2>
          <p className="text-white/70 text-lg max-w-md mx-auto leading-relaxed">
            The requested page could not be found on the server.
          </p>
        </div>

        {/* Go Home button */}
        <Link href="/">
          <button className="group relative overflow-hidden bg-transparent border-2 border-white/30 hover:border-white/60 text-white px-8 py-3 rounded-full font-semibold tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-white/20">
            <span className="relative z-10 flex items-center gap-2">
              <Home className="w-5 h-5" />
              GO HOME
            </span>
            <div className="absolute inset-0 bg-white/5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
          </button>
        </Link>

        {/* Subtle hint text */}
        <p className="text-white/40 text-sm mt-8 animate-fade-in-up">
          Lost in space? Let's get you back home.
        </p>
      </div>

      {/* Additional floating elements for depth */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-ping"></div>
      <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-white/30 rounded-full animate-pulse"></div>
      <div className="absolute top-1/2 left-1/6 w-1.5 h-1.5 bg-white/25 rounded-full animate-pulse"></div>
    </div>
  )
}
