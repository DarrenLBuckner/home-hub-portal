


import { notFound } from 'next/navigation';

// @ts-ignore Next.js App Router type inference bug workaround
export default function DiagnosticPage({ params }: { params: { slug?: string[] } }) {
  // Next.js App Router expects params as an object with optional slug array
  console.log('Diagnostic page params:', params);
  return (
    <div className="p-8 bg-red-100">
      <h1>Route Diagnostic</h1>
      <p>Params: {JSON.stringify(params)}</p>
      <p>Slug: {params.slug?.join('/') || 'none'}</p>
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
