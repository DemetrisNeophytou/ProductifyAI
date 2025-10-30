/**
 * Terms of Service Page
 * Placeholder for production deployment
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
          <FileText className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold">Terms of Service</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agreement to Terms</CardTitle>
            <p className="text-sm text-muted-foreground">Last updated: October 21, 2025</p>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using ProductifyAI, you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our service.
            </p>

            <h2>2. Description of Service</h2>
            <p>
              ProductifyAI is a platform that helps users create digital products using
              AI-powered tools. We provide templates, content generation, image search,
              and other creative tools.
            </p>

            <h2>3. User Accounts</h2>
            <ul>
              <li>You must be at least 18 years old to use this service</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You are responsible for all activities under your account</li>
              <li>You must provide accurate and complete information</li>
              <li>You must not share your account credentials</li>
            </ul>

            <h2>4. Acceptable Use</h2>
            <p>You agree NOT to:</p>
            <ul>
              <li>Use the service for any illegal purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe on intellectual property rights</li>
              <li>Upload malicious code or viruses</li>
              <li>Attempt to gain unauthorized access</li>
              <li>Scrape or harvest data from the service</li>
              <li>Resell or redistribute our services</li>
            </ul>

            <h2>5. Intellectual Property</h2>
            <p>
              All content, features, and functionality of ProductifyAI are owned by us
              and are protected by copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              Content you create using our service belongs to you, subject to the licenses
              of any third-party assets used (images, templates, etc.).
            </p>

            <h2>6. Third-Party Services</h2>
            <p>Our service integrates with third-party providers:</p>
            <ul>
              <li><strong>Supabase:</strong> Authentication and database (Privacy Policy: supabase.com/privacy)</li>
              <li><strong>Stripe:</strong> Payment processing (Terms: stripe.com/legal)</li>
              <li><strong>Pexels/Pixabay/Unsplash:</strong> Stock images (respective licenses apply)</li>
              <li><strong>OpenAI:</strong> AI generation (Terms: openai.com/policies)</li>
            </ul>

            <h2>7. Subscriptions and Payments</h2>
            <ul>
              <li>Subscriptions are billed monthly or annually</li>
              <li>You can cancel your subscription at any time</li>
              <li>Refunds are subject to our refund policy</li>
              <li>Prices may change with 30 days notice</li>
              <li>Failed payments may result in service suspension</li>
            </ul>

            <h2>8. Content and Licenses</h2>
            <p>
              Images from Pexels and Pixabay are free for commercial use without attribution.
              Unsplash images require attribution. AI-generated content is yours to use
              commercially, subject to OpenAI's usage policies.
            </p>

            <h2>9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account for violations
              of these terms, illegal activity, or at our discretion with notice.
            </p>

            <h2>10. Disclaimer of Warranties</h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER
              EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS
              FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h2>11. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING
              OUT OF YOUR USE OF THE SERVICE.
            </p>

            <h2>12. Governing Law</h2>
            <p>
              These terms shall be governed by the laws of [Your Jurisdiction], without
              regard to conflict of law provisions.
            </p>

            <h2>13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify
              users of material changes via email or a notice on the service.
            </p>

            <h2>14. Contact Information</h2>
            <p>
              For questions about these Terms of Service, contact us at:
              <br />
              <strong>legal@productify.ai</strong>
            </p>

            <div className="mt-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a placeholder terms of service. Please consult
                with a legal professional to create comprehensive terms that comply with
                all applicable laws and regulations in your jurisdiction.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

