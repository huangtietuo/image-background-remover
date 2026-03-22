import Link from 'next/link';

export const metadata = {
  title: 'About - Background Remover',
  description: 'About Background Remover - free online AI-powered image background removal',
};

export default function About() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">About Background Remover</h1>

        <div className="bg-white rounded-xl shadow-sm p-8 prose max-w-none">
          <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
          <p>
            Background Remover is a simple, fast, and affordable online tool for removing image backgrounds. 
            We believe that useful tools shouldn't break the bank, and you shouldn't have to download bulky 
            software just to remove a background from an image.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-4">How It Works</h2>
          <p>
            We use AI-powered technology from Remove.bg to automatically remove backgrounds from your images. 
            Our entire infrastructure runs on Cloudflare's global edge network, which means:
          </p>
          <ul>
            <li><strong>Fast:</strong> Your images are processed close to you, anywhere in the world</li>
            <li><strong>Private:</strong> We never store your images on our servers</li>
            <li><strong>Affordable:</strong> Cloudflare's free tier gets us started for zero cost</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Why Use Us</h2>
          <p>
            Compared to other services:
          </p>
          <ul>
            <li>✅ Simpler, cleaner interface - no annoying popups</li>
            <li>✅ Cheaper pricing for regular use</li>
            <li>✅ Mobile-friendly - works on your phone</li>
            <li>✅ Privacy-focused - we don't store your images</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-6 mb-4">Contact</h2>
          <p>
            If you have any questions, feedback, or issues, feel free to open an issue on our GitHub repository.
          </p>
        </div>
      </main>

      <footer className="bg-white mt-16 py-8 text-center text-gray-600">
        <p>© {new Date().getFullYear()} Background Remover. All rights reserved.</p>
      </footer>
    </div>
  );
}
