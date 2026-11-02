import './globals.css';
import { SiteHeader } from '@/components/SiteHeader';
export const metadata = { title: 'EstateStay — A slower kind of luxury', description: 'A coffee estate retreat in Chikkamagaluru.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><SiteHeader />{children}</body></html>; }
