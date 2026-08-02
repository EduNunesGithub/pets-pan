import "@/app/globals.css";

import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
});

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      className={`${ibmPlexMono.variable} ${ibmPlexSans.variable}`}
      lang="pt-BR"
    >
      <body>{children}</body>
    </html>
  );
}
