/**
 * Privacy Policy Page
 * Placeholder for production deployment
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Privacy Matters</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: October 21, 2025</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you create an account,
              use our services, or communicate with us. This may include:
            </p>
            <ul>
              <li>Email address and password (encrypted)</li>
              <li>Profile information (name, preferences)</li>
              <li>Usage data and analytics (anonymized)</li>
              <li>Payment information (processed by Stripe, not stored by us)</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Analyze usage patterns to improve user experience</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>
              We do not sell, trade, or rent your personal information to third parties.
              We may share your information with:
            </p>
            <ul>
              <li>Service providers who assist in our operations (Supabase, Stripe)</li>
              <li>Legal authorities when required by law</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>
              We implement industry-standard security measures including:
            </p>
            <ul>
              <li>Encrypted data transmission (HTTPS)</li>
              <li>Encrypted password storage</li>
              <li>Regular security audits</li>
              <li>Secure authentication via Supabase</li>
            </ul>

            <h2>5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data</li>
              <li>Opt-out of marketing communications</li>
            </ul>

            <h2>6. Cookies and Tracking</h2>
            <p>
              We use minimal cookies for essential functionality (authentication, preferences).
              Analytics are privacy-friendly and cookie-free (Plausible Analytics).
            </p>

            <h2>7. Third-Party Services</h2>
            <p>Our application uses the following third-party services:</p>
            <ul>
              <li><strong>Supabase:</strong> Authentication and database</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Pexels/Pixabay/Unsplash:</strong> Stock images</li>
              <li><strong>OpenAI:</strong> AI content generation</li>
              <li><strong>Plausible:</strong> Privacy-friendly analytics</li>
            </ul>

            <h2>8. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly
              collect information from children under 13.
            </p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you
              of any changes by posting the new policy on this page and updating the
              "Last updated" date.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, please contact us at:
              <br />
              <strong>privacy@productify.ai</strong>
            </p>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a placeholder privacy policy. Please consult
                with a legal professional to create a comprehensive privacy policy that
                complies with GDPR, CCPA, and other applicable privacy regulations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

