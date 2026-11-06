import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = { 
  title: 'Contact Us – Chhotu Fashion | Get in Touch' 
};

export default function ContactPage() {
  return <ContactClient />;
}
