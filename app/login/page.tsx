import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/chat")

  return (
    <div
      className="min-h-full flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #07070d 0%, #0a0a13 50%, #0d0d1a 100%)" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Login card */}
      <div
        className="relative w-full max-w-sm rounded-2xl p-8"
        style={{
          background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Top decorative gradient line */}
        <div
          className="absolute top-0 left-8 right-8 h-px rounded-full"
          style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }}
        />

        {/* Logo and header */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-2xl"
              style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #2563eb 100%)" }}
            >
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
            </div>
            <div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ boxShadow: "0 0 32px rgba(99,102,241,0.3)" }}
            />
          </div>

          <h1 className="text-2xl font-semibold mb-2" style={{ color: "rgba(255,255,255,0.95)" }}>
            Bienvenido de vuelta
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(156,163,175,0.9)" }}>
            Inicia sesión para continuar con {process.env.NEXT_PUBLIC_APP_NAME ?? "AI Asistente"}
          </p>
        </div>

        {/* Auth buttons */}
        <div className="space-y-3">
          <form
            action={async () => {
              "use server"
              await signIn("github", { redirectTo: "/chat" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 font-medium py-3 px-4 rounded-xl text-sm transition-all duration-200 active:scale-[0.98]"
              style={{
                background: "rgba(36,41,46,0.95)",
                color: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
              </svg>
              Continuar con GitHub
            </button>
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          <span className="text-[11px] text-gray-600 font-medium">acceso seguro</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-5">
          {[
            { icon: "🔒", label: "Cifrado SSL" },
            { icon: "🛡️", label: "Sin contraseña" },
            { icon: "✨", label: "Gratis" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span className="text-xs">{item.icon}</span>
              <span className="text-[11px] text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>

        <p className="text-center text-[11px] text-gray-600 mt-5">
          Al iniciar sesión, aceptas nuestros términos de uso
        </p>
      </div>
    </div>
  )
}
