import { Suspense } from 'react';
import BookForm from './BookForm';
export default function BookPage() { return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-linen"><p className="eyebrow">Preparing your stay…</p></main>}><BookForm /></Suspense>; }
