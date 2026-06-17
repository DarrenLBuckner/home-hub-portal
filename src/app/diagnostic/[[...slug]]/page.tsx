


import { notFound } from 'next/navigation';

export default async function DiagnosticPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  // Next.js App Router (v15+) provides params as a promise
  const { slug } = await params;
  console.log('Diagnostic page params:', { slug });
  return (
    <div className="p-8 bg-red-100">
      <h1>Route Diagnostic</h1>
      <p>Params: {JSON.stringify({ slug })}</p>
      <p>Slug: {slug?.join('/') || 'none'}</p>
      <div className="mt-4">
        <h2>Test these routes:</h2>
        <ul className="list-disc ml-4">
          <li><a href="/diagnostic" className="text-blue-500">/diagnostic</a></li>
          <li><a href="/diagnostic/test" className="text-blue-500">/diagnostic/test</a></li>
          <li><a href="/diagnostic/dashboard/agent" className="text-blue-500">/diagnostic/dashboard/agent</a></li>
        </ul>
      </div>
    </div>
  );
}
