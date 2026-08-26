import type {
  Metadata,
  Viewport,
} from "next";

import "./globals.css";

import Shell from "@/components/layout/Shell";
import {
  ThemeProvider,
} from "@/context/ThemeContext";
import InteractiveOnboarding from "@/components/onboarding/InteractiveOnboarding";

export const viewport:
  Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    {
      media:
        "(prefers-color-scheme: light)",
      color:
        "#f7f7f8",
    },
    {
      media:
        "(prefers-color-scheme: dark)",
      color:
        "#0a0a0b",
    },
  ],
};

export const metadata:
  Metadata = {
  title: "Khairo Diet Clinic",
  description: "...",

  appleWebApp: {
    capable: true,
    statusBarStyle:
      "black-translucent",
    title: "Khairo Diet Clinic",
  },

  formatDetection: {
    telephone: false,
  },
};

const themeScript = `
(function () {
  try {
    var saved =
      localStorage.getItem(
        "khairo-theme"
      );

    var theme =
      saved === "light" ||
      saved === "dark"
        ? saved
        : window.matchMedia(
            "(prefers-color-scheme: dark)"
          ).matches
          ? "dark"
          : "light";

    document.documentElement.dataset.theme =
      theme;

    document.documentElement.style.colorScheme =
      theme;
  } catch (error) {
    document.documentElement.dataset.theme =
      "dark";

    document.documentElement.style.colorScheme =
      "dark";
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <meta
          name="khairo-theme-color"
          content="#0a0a0b"
        />

        <script
          dangerouslySetInnerHTML={{
            __html:
              themeScript,
          }}
        />
      </head>

      <body>
        <ThemeProvider>
          <Shell>
            {children}
          </Shell>
          <InteractiveOnboarding />
        </ThemeProvider>
      </body>
    </html>
  );
}
