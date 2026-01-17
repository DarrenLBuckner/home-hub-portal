import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal HomeHub Demo - Multi-Country Platform',
  description: 'See Portal HomeHub operating across Caribbean, African, and Latin American markets.',
};

export default function DemoPage() {
  redirect('/register/select-country');
}
