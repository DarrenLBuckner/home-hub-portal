import { headers } from 'next/headers';
import RegisterClient from './RegisterClient';

export default async function RegistrationPage() {
  const headersList = await headers();
  const initialSiteName = headersList.get('x-country-name') || 'Portal Home Hub';

  return <RegisterClient initialSiteName={initialSiteName} />;
}
