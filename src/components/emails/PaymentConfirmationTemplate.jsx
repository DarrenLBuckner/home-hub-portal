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
            <Text style={{ marginTop: 20, padding: 16, background: '#dcfce7', borderRadius: 8, border: '1px solid #16a34a' }}>Have billing questions or need support? Contact us directly on WhatsApp:</Text>
            <Link href="https://wa.me/5927629797?text=Hi%2C%20I%20have%20a%20question%20about%20my%20payment%20for%20Portal%20Home%20Hub." 
                  style={{ display: 'inline-block', marginTop: 12, padding: '12px 24px', background: '#16a34a', color: '#ffffff', textDecoration: 'none', borderRadius: 8, fontWeight: 'bold' }}>
              📱 WhatsApp Support: +592 762-9797
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
