export default function PageWrapper({ children }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 md:px-16 py-10">
      <div className="w-full max-w-sm stagger">
        {children}
      </div>
    </div>
  )
}