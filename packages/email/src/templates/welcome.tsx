import { Html, Head, Body, Container, Heading, Text, Button } from '@react-email/components';

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'Arial, sans-serif' }}>
        <Container>
          <Heading>Welcome to LinkRescue!</Heading>
          <Text>Hi {name},</Text>
          <Text>
            Thanks for signing up! We're excited to help you find and fix broken affiliate links on
            your website.
          </Text>
          <Button href={process.env.NEXT_PUBLIC_APP_URL}>Get Started</Button>
        </Container>
      </Body>
    </Html>
  );
}
