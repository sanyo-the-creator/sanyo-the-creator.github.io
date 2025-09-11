import React from 'react';
import './Privacy.css';

const Privacy: React.FC = () => {
    return (
        <div className="privacy-page">
            <div className="privacy-section">
                <div className="privacy-card">
                    <h2>Privacy Policy</h2>

                    <div className="privacy-text">
                        <p>At Upshift, your privacy is our priority. This Privacy Policy outlines how we collect, use, and protect your personal information when you use our productivity and app blocking app. By accessing or using Upshift, you consent to the practices described below.</p>

                        <h3>1. Information We Collect</h3>
                        <p>We collect the following types of information to provide and improve our services:</p>

                        <p><strong>1.1 Personal Information:</strong></p>
                        <p>Account details such as name, email address, and age range (if provided).</p>
                        <p>Payment information for subscription services (processed securely by third-party providers).</p>

                        <p><strong>1.2 Usage Data:</strong></p>
                        <p>App activity, such as feature usage, session duration, and app blocking statistics.</p>
                        <p>Device information, including operating system, app version, IP address, and installed applications (for app blocking functionality).</p>
                        <p>Quest progress, habit tracking data, streaks, and goal achievements.</p>
                        <p>Time tracking data, focus session statistics, and activity logs.</p>
                        <p>Group participation data, leaderboard rankings, and social interactions.</p>

                        <p><strong>1.3 Optional Data:</strong></p>
                        <p>Profile photos, and custom themes.</p>
                        <p>Friend codes, affiliate referrals, and group invitations.</p>

                        <h3>2. How We Use Your Information</h3>
                        <p>We use your information to:</p>
                        <p>Provide, personalize, and improve the app's functionality including app blocking features.</p>
                        <p>Track your progress in quests, habits, goals, and provide personalized recommendations.</p>
                        <p>Enable group functionality, leaderboards, and social features.</p>
                        <p>Send notifications about quest reminders, group activities, and achievements.</p>
                        <p>Process affiliate rewards and referral programs.</p>
                        <p>Communicate with you about updates, features, and support.</p>
                        <p>Analyze usage trends to enhance user experience and app blocking effectiveness.</p>
                        <p>Process payments and manage subscriptions.</p>
                        <p>Ensure compliance with our Terms and Conditions.</p>

                        <h3>3. Data Sharing</h3>
                        <p>We do not sell or rent your personal information to third parties. However, we may share information in the following cases:</p>

                        <p><strong>3.1 Service Providers:</strong></p>
                        <p>Trusted third parties that assist with payment processing, analytics, and app hosting.</p>

                        <p><strong>3.2 Legal Compliance:</strong></p>
                        <p>When required to comply with legal obligations or protect the rights, safety, and property of Upshift, its users, or others.</p>

                        <p><strong>3.3 Business Transfers:</strong></p>
                        <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity.</p>

                        <h3>4. Data Security</h3>
                        <p>We implement industry-standard security measures to protect your personal information. However, no method of electronic storage or transmission is 100% secure. While we strive to protect your data, we cannot guarantee its absolute security.</p>

                        <h3>5. Your Rights</h3>
                        <p>Depending on your location, you may have the following rights regarding your data:</p>
                        <p>Access and Portability: Request access to or a copy of your personal data.</p>
                        <p>Correction: Update or correct inaccurate information.</p>
                        <p>Deletion: Request the deletion of your account and associated data.</p>
                        <p>Restriction: Limit the processing of your data in certain circumstances.</p>
                        <p>Withdrawal of Consent: Revoke consent for specific data uses.</p>
                        <p>To exercise these rights, contact us at support&#64;joinupshift.com.</p>

                        <h3>6. Photo and Media Storage</h3>
                        <p>If you choose to upload photos (profile pictures, goal progress photos), these are stored securely and used only for the purposes you specify. You can delete uploaded photos at any time through the app settings.</p>

                        <h3>7. Data Retention</h3>
                        <p>We retain your personal data for as long as necessary to provide the app's services or comply with legal obligations. Upon account deletion, we will securely delete or anonymize your data unless required by law to retain it.</p>
                        <p>Quest progress, habit data, and group participation history may be retained for statistical analysis in anonymized form.</p>

                        <h3>8. Cookies and Tracking Technologies</h3>
                        <p>Upshift uses cookies and similar technologies to:</p>
                        <p>Understand app usage and improve functionality.</p>
                        <p>Deliver a seamless and personalized experience.</p>
                        <p>You can control cookie preferences through your device settings.</p>

                        <h3>9. Third-Party Links</h3>
                        <p>Our app may include links to third-party websites or services. We are not responsible for the privacy practices or content of these third parties. We encourage you to review their privacy policies before providing any information.</p>

                        <h3>10. Updates to this Privacy Policy</h3>
                        <p>We may update this Privacy Policy periodically to reflect changes in our practices or for legal reasons. We will notify you of significant updates and encourage you to review this document regularly.</p>
                    </div>
                </div>
            </div>

            {/* Last Updated */}
            <div className="last-updated">
                <p>Last updated: July 2025</p>
            </div>
        </div>
    );
};

export default Privacy;
