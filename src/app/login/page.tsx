import { headers } from 'next/headers';
import LoginClient from './LoginClient';

export default async function LoginPage() {
  const headersList = await headers();
  const initialSiteName = headersList.get('x-country-name') || 'Portal Home Hub';

  return <LoginClient initialSiteName={initialSiteName} />;
}
