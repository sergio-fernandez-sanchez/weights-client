export default function PageWrapper({ children }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-6 md:px-16">
      <div className="w-full max-w-sm">
        {children}
      </div>
    </div>
  )
}
