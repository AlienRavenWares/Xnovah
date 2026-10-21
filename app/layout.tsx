import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Xnovah AI — Imagine more. Create beyond.', description: 'One creative AI workspace for writing, visuals, video, voice, research and more. Join the Xnovah AI early access list.', openGraph: {title:'Xnovah AI — Imagine more. Create beyond.',description:'Your ideas deserve a bigger universe.'} };
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
