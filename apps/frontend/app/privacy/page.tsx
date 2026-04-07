import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Background Remover',
  description: 'Privacy Policy for Background Remover',
};

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            🖼️ Background Remover
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="bg-white rounded-xl shadow-sm p-8 prose max-w-none">
          <p className="text-gray-700">
            Last updated: March 22, 2026
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Overview</h2>
          <p>
            We take your privacy seriously. This policy explains how we handle your data when you use our background removal service.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Image Processing</h2>
          <p>
            <strong>We do not store your images.</strong> When you upload an image for background removal:
          </p>
          <ul>
            <li>The image is sent directly to our Cloudflare Worker at the edge network</li>
            <li>The worker proxies the request to the Remove.bg API</li>
            <li>The processed image is streamed directly back to your browser</li>
            <li>No images are stored on our servers or disks at any point</li>
            <li>All processing happens in-memory and is immediately discarded after the request completes</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Logging</h2>
          <p>
            We do not log or store:
          </p>
          <ul>
            <li>The content of your images</li>
            <li>Your uploaded files</li>
            <li>Processed results</li>
          </ul>
          <p>
            For rate limiting purposes, we may keep a temporary count of requests per IP address. This information is not linked to any personal information and is reset daily.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Third-Party Services</h2>
          <p>
            We use the Remove.bg API to process your images. Your image is shared with Remove.bg when you use our service. 
            Please refer to the <a href="https://www.remove.bg/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Remove.bg Privacy Policy</a> for information about how they handle your data.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Analytics</h2>
          <p>
            We do not use any third-party analytics or tracking cookies in our MVP version.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Contact</h2>
          <p>
            If you have any questions about this privacy policy, please contact us.
          </p>
        </div>
      </main>

      <footer className="bg-white mt-16 py-8 text-center text-gray-600">
        <p>© {new Date().getFullYear()} Background Remover. All rights reserved.</p>
      </footer>
    </div>
  );
}
