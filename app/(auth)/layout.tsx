import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Form */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {children}
        </div>
      </div>

      {/* Right side - Medical Image */}
      <div className="hidden lg:block relative bg-gradient-to-br from-blue-500 to-blue-700">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold">HealthFlow</h1>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              AI-Powered Healthcare Management
            </h2>
            <p className="text-xl text-blue-100">
              Streamline your clinic operations with intelligent automation and modern tools
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 w-full max-w-md mt-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">50K+</div>
              <div className="text-sm text-blue-100">Patients Managed</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">1K+</div>
              <div className="text-sm text-blue-100">Healthcare Providers</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">98%</div>
              <div className="text-sm text-blue-100">Satisfaction Rate</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">24/7</div>
              <div className="text-sm text-blue-100">AI Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}