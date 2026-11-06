import type { Metadata } from 'next';
import './globals.css';
import StorefrontLayout from '@/components/StorefrontLayout';

export const metadata: Metadata = {
  title: "Chhotu Fashion – India's Most Loved Kids Clothing Brand",
  description: "Shop India's finest kids clothing at Chhotu Fashion. Premium ethnic wear, western casuals, festive collection & school uniforms for girls & boys aged 0–14 years. Free delivery above ₹499.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

      </head>
      <body>
        <StorefrontLayout>
          {children}
        </StorefrontLayout>
      </body>
    </html>
  );
}
