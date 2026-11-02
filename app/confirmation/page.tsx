import { Suspense } from 'react';
import ConfirmationClient from './ConfirmationClient';
export default function ConfirmationPage(){return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-forest text-white"><p className="eyebrow">Loading confirmation…</p></main>}><ConfirmationClient/></Suspense>}
