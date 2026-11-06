import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import ShopClient from './ShopClient';

export const metadata: Metadata = {
  title: 'Shop – Chhotu Fashion | Kids Clothing Collection',
  description: 'Explore our wide range of kids clothing. Filter by gender, category, age, and price to find the perfect outfit for your little one.',
};

export default function ShopPage() {
  return <ShopClient />;
}
