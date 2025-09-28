import { Html, Head, Preview, Body, Container, Section, Text, Link } from '@react-email/components';

export default function WelcomeEmailTemplate({ userName }) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Portal Home Hub!</Preview>
      <Body style={{ background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px #e5e7eb', padding: 32 }}>
          <Section>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2563eb', marginBottom: 12 }}>Welcome to Portal Home Hub!</Text>
            <Text>Hi {userName || 'there'},</Text>
            <Text>Your account is now active. You can log in and start listing your property.</Text>
            <Link href="https://portalhomehub.com/login" style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 18 }}>Login to your account</Link>
            <Text style={{ marginTop: 24 }}>Thank you for joining us!</Text>
            <Text style={{ marginTop: 20, padding: 16, background: '#dcfce7', borderRadius: 8, border: '1px solid #16a34a' }}>Need help getting started? Contact our support team on WhatsApp for instant assistance:</Text>
            <Link href="https://wa.me/5927629797?text=Hi%2C%20I%20just%20created%20my%20account%20and%20need%20help%20getting%20started%20with%20Portal%20Home%20Hub." 
                  style={{ display: 'inline-block', marginTop: 12, padding: '12px 24px', background: '#16a34a', color: '#ffffff', textDecoration: 'none', borderRadius: 8, fontWeight: 'bold' }}>
              📱 WhatsApp Support: +592 762-9797
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
