import React from 'react';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-8">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-white mr-3" />
              <div>
                <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
                <p className="text-green-100 mt-2">
                  Last updated: {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-8 space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                Asiatech College and the Asiatech Career Connect (ACC) platform are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information when you use our career services platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Name, email address, phone number</li>
                    <li>Educational background and academic records</li>
                    <li>Professional experience and skills</li>
                    <li>Profile photos and resume documents</li>
                    <li>Contact preferences and communication history</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Login credentials (encrypted passwords)</li>
                    <li>Account settings and preferences</li>
                    <li>User role and verification status</li>
                    <li>Platform usage history and activity logs</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Job-Related Data</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>Job applications and screening responses</li>
                    <li>Interview schedules and feedback</li>
                    <li>Employment status and placement history</li>
                    <li>Performance ratings and reviews</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Technical Information</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                    <li>IP addresses and device information</li>
                    <li>Browser type and operating system</li>
                    <li>Access times and usage patterns</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Core Platform Functions:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Creating and maintaining user profiles</li>
                  <li>Facilitating job matching and applications</li>
                  <li>Enabling communication between users and employers</li>
                  <li>Managing interview scheduling and feedback</li>
                  <li>Tracking employment outcomes and success rates</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">Service Improvement:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Analyzing platform usage to enhance user experience</li>
                  <li>Developing new features and services</li>
                  <li>Providing personalized job recommendations</li>
                  <li>Generating statistical reports and insights</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">Communication:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Sending notifications about applications and interviews</li>
                  <li>Providing platform updates and announcements</li>
                  <li>Responding to support requests and inquiries</li>
                  <li>Sharing relevant career opportunities</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-900">Within the Platform:</h3>
                <p>Your profile information is shared with relevant parties (employers, coordinators) for job matching and placement purposes. You control the visibility of your information through privacy settings.</p>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">External Sharing:</h3>
                <p>We do not sell, rent, or trade your personal information to third parties. Limited sharing may occur only in these circumstances:</p>
                <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                  <li>With your explicit consent</li>
                  <li>For legitimate business purposes (e.g., background verification)</li>
                  <li>To comply with legal obligations or court orders</li>
                  <li>To protect our rights, safety, or property</li>
                  <li>With service providers under strict confidentiality agreements</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">Aggregate Data:</h3>
                <p>We may share anonymized, aggregated statistics about platform usage, employment trends, and success rates for research and reporting purposes.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <div className="space-y-4 text-gray-700">
                <p>We implement robust security measures to protect your data:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Encryption:</strong> All data transmission is encrypted using TLS/SSL protocols</li>
                  <li><strong>Access Control:</strong> Strict authentication and authorization mechanisms</li>
                  <li><strong>Regular Updates:</strong> Continuous security patches and system updates</li>
                  <li><strong>Monitoring:</strong> 24/7 system monitoring for security incidents</li>
                  <li><strong>Backup:</strong> Regular data backups with secure storage</li>
                  <li><strong>Staff Training:</strong> Regular security awareness training for personnel</li>
                </ul>
                <p className="mt-4">
                  While we strive to protect your information, no system is completely secure. We encourage users to maintain strong passwords and report any suspicious activity immediately.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
              <div className="space-y-4 text-gray-700">
                <p>We retain your information for different periods based on its purpose:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Active Accounts:</strong> Information is retained while your account is active</li>
                  <li><strong>Inactive Accounts:</strong> Data may be archived after 2 years of inactivity</li>
                  <li><strong>Employment Records:</strong> Historical employment data is kept for reporting purposes</li>
                  <li><strong>Legal Requirements:</strong> Some data may be retained longer to comply with regulations</li>
                  <li><strong>Deletion Requests:</strong> Data is removed within 30 days of valid deletion requests</li>
                </ul>
                <p className="mt-4">
                  Even after deletion, some information may persist in backup systems for a limited time before complete removal.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Your Rights and Choices</h2>
              <div className="space-y-4 text-gray-700">
                <h3 className="text-lg font-semibold text-gray-900">Access and Portability:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>View and download your personal data</li>
                  <li>Request copies of your information in machine-readable format</li>
                  <li>Access your activity history and data usage logs</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">Control and Correction:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Update or correct inaccurate information</li>
                  <li>Modify privacy settings and visibility preferences</li>
                  <li>Manage communication preferences and notifications</li>
                </ul>

                <h3 className="text-lg font-semibold text-gray-900 mt-6">Deletion and Restriction:</h3>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Request deletion of your account and associated data</li>
                  <li>Restrict processing of specific information</li>
                  <li>Object to certain uses of your data</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <div className="space-y-4 text-gray-700">
                <p>ACC uses cookies and similar technologies to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Maintain user sessions and preferences</li>
                  <li>Analyze platform usage and performance</li>
                  <li>Provide personalized content and recommendations</li>
                  <li>Ensure platform security and prevent fraud</li>
                </ul>
                <p className="mt-4">
                  You can control cookie settings through your browser, but some platform features may not function properly with cookies disabled.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                ACC is designed for college students and graduates (18+ years old). We do not knowingly collect personal information from children under 18. If we become aware of such data collection, we will delete the information immediately and terminate the account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your data is primarily stored and processed in the Philippines. If international transfers are necessary for platform operations, we ensure appropriate safeguards are in place to protect your information according to applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Updates to This Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy periodically to reflect changes in our practices, technology, or legal requirements. Significant changes will be communicated through platform notifications or email. Continued use of ACC after policy updates constitutes acceptance of the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <div className="space-y-4 text-gray-700">
                <p>For privacy-related questions, concerns, or requests, please contact:</p>
                <div className="bg-gray-100 rounded-lg p-4">
                  <p><strong>Data Protection Officer</strong><br />
                  Asiatech Career Connect</p>
                  <p className="mt-2">
                    <strong>Email:</strong> info@asiatech.edu.ph<br />
                    <strong>Phone:</strong> 0927 822 3741<br />
                    <strong>Address:</strong> 1506 National Highway (Entrance of Golden City), Brgy. Dila, City of Santa Rosa, Laguna
                  </p>
                </div>
                <p>We will respond to privacy requests within 30 days and work diligently to resolve any concerns.</p>
              </div>
            </section>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Your Privacy Matters</h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                We are committed to transparency in our data practices. If you have any questions about how your information is handled or want to exercise your privacy rights, please don't hesitate to contact us. Your trust is essential to our mission of connecting students with career opportunities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
