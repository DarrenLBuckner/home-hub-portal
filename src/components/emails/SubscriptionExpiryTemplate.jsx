import { Html, Head, Preview, Body, Container, Section, Text, Link } from '@react-email/components';

export default function SubscriptionExpiryTemplate({ userName, expiry }) {
  return (
    <Html>
      <Head />
      <Preview>Subscription Expiry Notice - Portal Home Hub</Preview>
      <Body style={{ background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e5e7eb', padding: 32 }}>
          <Section>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#f59e42', marginBottom: 12 }}>Subscription Expiry Notice</Text>
            <Text>Hi {userName || 'there'},</Text>
            <Text>Your subscription is about to expire. Please renew to continue listing your property.</Text>
            <Text>Expiry Date: <b>{expiry}</b></Text>
            <Link href="https://portalhomehub.com/dashboard/fsbo" style={{ color: '#f59e42', fontWeight: 'bold', fontSize: 18 }}>Renew your subscription</Link>
            <Text style={{ marginTop: 24 }}>Contact support if you need help.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
