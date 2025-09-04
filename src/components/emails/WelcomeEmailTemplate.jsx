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
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
