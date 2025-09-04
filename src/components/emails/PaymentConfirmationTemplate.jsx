import { Html, Head, Preview, Body, Container, Section, Text, Link } from '@react-email/components';

export default function PaymentConfirmationTemplate({ userName, plan, expiry }) {
  return (
    <Html>
      <Head />
      <Preview>Payment Confirmation - Portal Home Hub</Preview>
      <Body style={{ background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e5e7eb', padding: 32 }}>
          <Section>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#16a34a', marginBottom: 12 }}>Payment Received</Text>
            <Text>Hi {userName || 'there'},</Text>
            <Text>Your payment was successful and your subscription is now active.</Text>
            <Text>Plan: <b>{plan}</b></Text>
            <Text>Expiry Date: <b>{expiry}</b></Text>
            <Link href="https://portalhomehub.com/dashboard/fsbo" style={{ color: '#16a34a', fontWeight: 'bold', fontSize: 18 }}>Go to your dashboard</Link>
            <Text style={{ marginTop: 24 }}>Thank you for your business!</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
