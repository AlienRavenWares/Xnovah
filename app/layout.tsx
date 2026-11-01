import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
 metadataBase: new URL('https://xnovah-main.vercel.app'),
 title: { default:'Xnovah AI — Imagine more. Create beyond.', template:'%s | Xnovah AI' },
 description:'Explore Xnovah AI: a creative workspace in development for writing, images, video, voice, research and business workflows. Discover 39 planned tools and join early access.',
 applicationName:'Xnovah AI',
 robots:{index:true,follow:true},
 openGraph:{type:'website',url:'https://xnovah-main.vercel.app',siteName:'Xnovah AI',title:'Xnovah AI — Imagine more. Create beyond.',description:'Discover creative AI workflows, use cases and 39 planned tools in the Xnovah universe.'},
 twitter:{card:'summary_large_image',title:'Xnovah AI — Imagine more. Create beyond.',description:'Explore creative AI tools and workflows coming to Xnovah.'}
};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>}
