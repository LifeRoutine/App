import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { AppProvider } from "@/lib/app-context";
import { DemoLoginGate } from "@/components/demo-login-gate";
import { DeviceFrame } from "@/components/device-frame";
import { OnboardingGate } from "@/components/onboarding-gate";
import { PinGate } from "@/components/pin-gate";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LifeRoutine",
  description: "Dein Alltag. Einfacher.",
  applicationName: "LifeRoutine",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LifeRoutine",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#2f6f9f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="h-dvh overflow-hidden font-sans text-ink">
        <PwaRegister />
        <AppProvider>
          <DeviceFrame>
            <DemoLoginGate>
              <PinGate>
                <OnboardingGate>{children}</OnboardingGate>
              </PinGate>
            </DemoLoginGate>
          </DeviceFrame>
        </AppProvider>
      </body>
    </html>
  );
}
