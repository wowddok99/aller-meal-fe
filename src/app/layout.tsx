import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable.css";
import { ApiClientProvider } from "@/shared/api/api-client-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "AllerMeal",
  description: "학교 급식 메뉴와 알레르기 유발 성분을 쉽고 빠르게 확인하세요.",
  icons: {
    icon: [{ url: "/brand/allermeal-logo.png", type: "image/png" }],
    apple: [{ url: "/brand/allermeal-logo.png", type: "image/png" }],
  },
};

const themeScript = `
(() => {
  try {
    const storedTheme = window.localStorage.getItem("allermeal-theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = storedTheme === "light" || storedTheme === "dark"
      ? storedTheme
      : systemDark ? "dark" : "light";
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch (_) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body suppressHydrationWarning>
        <ApiClientProvider>{children}</ApiClientProvider>
      </body>
    </html>
  );
}
