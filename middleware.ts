export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/patients/:path*",
    "/appointments/:path*",
    "/prescriptions/:path*",
    "/records/:path*",
    "/ai-assistant/:path*",
    "/settings/:path*",
  ],
}