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
            <Text style={{ marginTop: 24 }}>Need help with renewal or have questions? Contact our support team directly:</Text>
            <Text style={{ marginTop: 16, padding: 16, background: '#fef3c7', borderRadius: 8, border: '1px solid #f59e42' }}>Get instant help with your subscription renewal on WhatsApp:</Text>
            <Link href="https://wa.me/5927629797?text=Hi%2C%20I%20need%20help%20renewing%20my%20subscription%20for%20Portal%20Home%20Hub." 
                  style={{ display: 'inline-block', marginTop: 12, padding: '12px 24px', background: '#16a34a', color: '#ffffff', textDecoration: 'none', borderRadius: 8, fontWeight: 'bold' }}>
              📱 WhatsApp Support: +592 762-9797
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
