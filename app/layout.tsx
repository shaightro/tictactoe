import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"NEXUS — 3D 틱택토",description:"네온이 폭발하는 3D 틱택토 아레나. 무적 AI 또는 친구와 한 판.",icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko" className="dark"><body>{children}</body></html>;}
