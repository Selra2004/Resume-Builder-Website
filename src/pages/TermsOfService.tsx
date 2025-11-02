import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
            <div className="flex items-center">
              <DocumentTextIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
                <p className="text-primary-100 mt-2">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using the Asiatech Career Connect (ACC) platform, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Platform Purpose</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                ACC is a career services platform designed specifically for:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Students and graduates of Asiatech College</li>
                <li>Companies seeking to hire qualified candidates</li>
                <li>Career coordinators facilitating job placements</li>
                <li>Administrators managing platform operations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Eligibility</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>Student/Alumni Accounts:</strong> Must be current students or graduates of Asiatech College with valid institutional email addresses.</p>
                <p><strong>Company Accounts:</strong> Must represent legitimate business entities with proper registration and authorization to hire employees.</p>
                <p><strong>Coordinator Accounts:</strong> Must be authorized personnel of Asiatech College responsible for career services.</p>
                <p>Users must provide accurate, complete, and current information during registration and maintain the confidentiality of their account credentials.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Platform Usage Rules</h2>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Permitted Uses:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Creating and maintaining professional profiles</li>
                  <li>Searching and applying for job opportunities</li>
                  <li>Posting legitimate job openings (companies/coordinators)</li>
                  <li>Building and sharing professional resumes</li>
                  <li>Participating in interview processes</li>
                  <li>Providing feedback and ratings</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">Prohibited Activities:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Posting false, misleading, or fraudulent information</li>
                  <li>Harassment, discrimination, or inappropriate communication</li>
                  <li>Spamming or sending unsolicited commercial messages</li>
                  <li>Attempting to access unauthorized areas of the platform</li>
                  <li>Sharing login credentials with unauthorized parties</li>
                  <li>Scraping or automatically extracting platform data</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Content and Data</h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>User-Generated Content:</strong> Users retain ownership of their submitted content (resumes, profiles, applications) but grant ACC a license to use, display, and process this content for platform operations.</p>
                <p><strong>Data Accuracy:</strong> Users are responsible for ensuring the accuracy and currency of their profile information, job postings, and other submitted content.</p>
                <p><strong>Content Moderation:</strong> ACC reserves the right to review, modify, or remove content that violates these terms or is deemed inappropriate.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
              <p className="text-gray-700 leading-relaxed">
                Your privacy is important to us. Our collection, use, and protection of personal data is governed by our Privacy Policy, which forms an integral part of these Terms of Service. By using ACC, you consent to the practices described in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Employment and Job Placement</h2>
              <div className="space-y-4 text-gray-700">
                <p>ACC serves as a platform to facilitate connections between job seekers and employers but is not responsible for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>The accuracy of job postings or company representations</li>
                  <li>Employment decisions made by companies</li>
                  <li>Working conditions, compensation, or employment terms</li>
                  <li>Disputes arising from employment relationships</li>
                </ul>
                <p>Users are advised to conduct their own due diligence when engaging with potential employers or candidates.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Platform Availability and Modifications</h2>
              <div className="space-y-4 text-gray-700">
                <p>ACC strives to maintain platform availability but does not guarantee uninterrupted access. The platform may be temporarily unavailable due to maintenance, updates, or technical issues.</p>
                <p>We reserve the right to modify, suspend, or discontinue any part of the platform with or without notice. We may also update these Terms of Service, and continued use constitutes acceptance of such changes.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                ACC and Asiatech College shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the platform. Our total liability for any claims shall not exceed the fees paid by you (if any) for using the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Account Termination</h2>
              <div className="space-y-4 text-gray-700">
                <p>Accounts may be suspended or terminated for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violation of these Terms of Service</li>
                  <li>Fraudulent or misleading activities</li>
                  <li>Inappropriate conduct or harassment</li>
                  <li>Extended periods of inactivity</li>
                </ul>
                <p>Users may also voluntarily close their accounts at any time through their profile settings.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                The ACC platform, including its design, functionality, trademarks, and proprietary content, is owned by Asiatech College. Users may not reproduce, distribute, or create derivative works without explicit permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service are governed by the laws of the Philippines. Any disputes arising from these terms or platform usage shall be resolved through appropriate legal channels within the Philippines jurisdiction.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <div className="space-y-2 text-gray-700">
                <p>For questions about these Terms of Service, please contact:</p>
                <div className="bg-gray-100 rounded-lg p-4 mt-3">
                  <p><strong>Asiatech Career Connect Support</strong></p>
                  <p className="mt-2">
                    <strong>Email:</strong> info@asiatech.edu.ph<br />
                    <strong>Phone:</strong> 0927 822 3741<br />
                    <strong>Address:</strong> 1506 National Highway (Entrance of Golden City), Brgy. Dila, City of Santa Rosa, Laguna
                  </p>
                </div>
              </div>
            </section>

            <div className="bg-gray-100 rounded-lg p-6 mt-8">
              <p className="text-sm text-gray-600">
                <strong>Acknowledgment:</strong> By using the ACC platform, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. These terms constitute a legally binding agreement between you and Asiatech College.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
