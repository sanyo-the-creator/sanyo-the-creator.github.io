import React from 'react';
import './Terms.css';
import LightRays from '../../components/common/LightRays/LightRays';
const Terms: React.FC = () => {
    return (
        <div className="terms-page">
             <LightRays 
        raysOrigin="top-center"
        raysColor="#667EEA"
        raysSpeed={0.6}
        lightSpread={1.5}
        rayLength={2}
        pulsating={true}
        fadeDistance={1.2}
        saturation={0.8}
        followMouse={true}
        mouseInfluence={0.1}
        noiseAmount={0.05}
        distortion={0.1}
      />
            <div className="terms-section">
                <div className="terms-card">
                    <h2>Terms & Conditions</h2>

                    <div className="terms-text">
                    <p>Welcome to Upshift, a productivity and habit tracking app with app blocking capabilities designed to help users build better habits, achieve their goals, eliminate distractions, and develop a more productive lifestyle. By downloading or using our app, you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully.</p>

                    <h3>1. Acceptance of Terms</h3>
                    <p>By accessing or using Upshift, you agree to these Terms and Conditions and any additional terms applicable to certain features or services. If you do not agree, please discontinue use of the app immediately.</p>

                    <h3>2. Eligibility</h3>
                    <p>Upshift is available to users of all ages. However, if you are under 18 years old, you must have permission from a parent or legal guardian to use the app and create an account.</p>

                    <h3>3. Account Registration</h3>
                    <p>An account is required to use Upshift. By creating an account, you agree to:</p>
                    <p>Provide accurate, current, and complete information during registration.</p>
                    <p>Keep your login credentials secure.</p>
                    <p>Notify us immediately of any unauthorized use of your account.</p>

                    <h3>4. Use of the App</h3>
                    <p>Upshift is designed to provide productivity tools, habit tracking, quest systems, app blocking features, goal setting, time tracking, group challenges, leaderboards, affiliate programs, and community support for personal development. You agree to use the app responsibly and in accordance with these Terms. You may not:</p>
                    <p>Use the app for unlawful purposes or activities.</p>
                    <p>Disrupt or interfere with the app's functionality.</p>
                    <p>Attempt to reverse-engineer or exploit the app's software.</p>

                    <h3>5. App Blocking Features</h3>
                    <p>Upshift includes app blocking functionality that may restrict access to certain applications on your device. By using these features, you acknowledge that:</p>
                    <p>App blocking requires specific device permissions and may affect your device's normal operation.</p>
                    <p>You are responsible for configuring blocking settings appropriately for your needs.</p>
                    <p>Upshift is not liable for any inconvenience or issues arising from the use of app blocking features.</p>
                    <p>You can disable app blocking features at any time through the app settings.</p>

                    <h3>6. Quest System and Progress Tracking</h3>
                    <p>Upshift includes a quest and habit tracking system where you can create, track, and complete various goals. By using these features, you acknowledge that:</p>
                    <p>Progress data is stored to provide continuity and analytics.</p>
                    <p>Streaks and achievements are calculated based on your reported activities.</p>
                    <p>You are responsible for accurately reporting your progress.</p>

                    <h3>7. Groups and Social Features</h3>
                    <p>Upshift offers group functionality where users can join communities and participate in group challenges. When using group features:</p>
                    <p>You may share progress data with other group members.</p>
                    <p>Group administrators have additional privileges to manage group settings and content.</p>
                    <p>You agree to respect other group members and follow community guidelines.</p>
                    <p>You can leave groups at any time, but shared data may remain visible to other members.</p>

                    <h3>8. Affiliate Program</h3>
                    <p>Upshift includes an affiliate program where users can earn rewards for referrals. By participating:</p>
                    <p>You agree to promote the app honestly and ethically.</p>
                    <p>Rewards are subject to verification and our discretion.</p>
                    <p>We reserve the right to modify or terminate the affiliate program at any time.</p>

                    <h3>9. Privacy and Data</h3>
                    <p>We are committed to protecting your privacy. Please review our Privacy Policy to understand how your data is collected, used, and stored. By using the app, you consent to the practices described in the Privacy Policy.</p>

                    <h3>10. Paid Subscriptions and Billing</h3>
                    <p>Certain features of Upshift are available through a paid subscription. By purchasing a subscription, you agree to:</p>
                    <p>Pay all applicable fees promptly.</p>
                    <p>Allow us to charge your provided payment method for recurring subscriptions until you cancel.</p>
                    <p>Cancellation and Refunds: You can cancel your subscription at any time through your device's app store. Refunds are subject to our discretion and applicable app store policies.</p>

                    <h3>11. Disclaimer of Warranties</h3>
                    <p>Upshift is provided on an "as-is" and "as-available" basis. We do not guarantee the app will be free of errors, interruptions, or security vulnerabilities. Results may vary for individual users.</p>

                    <h3>12. Limitation of Liability</h3>
                    <p>To the fullest extent permitted by law, Upshift and its creators are not liable for:</p>
                    <p>Any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the app.</p>
                    <p>Loss of data, reputation, or profits arising from the app's use.</p>

                    <h3>13. Group Guidelines</h3>
                    <p>Upshift provides group functionality for individuals seeking personal growth and productivity improvement. By participating in groups, you agree to:</p>
                    <p>Respect other group members' privacy and opinions.</p>
                    <p>Refrain from posting offensive, harmful, or illegal content.</p>
                    <p>Follow group-specific rules set by group administrators.</p>
                    <p>Violation of these guidelines may result in removal from groups or suspension of your account.</p>

                    <h3>14. Intellectual Property</h3>
                    <p>All content, trademarks, and materials provided through Upshift are the property of the app's creators or licensed to us. You may not reproduce, distribute, or modify this content without prior permission.</p>

                    <h3>15. Changes to Terms</h3>
                    <p>We may update these Terms and Conditions periodically. Continued use of the app after such changes constitutes your acceptance of the new terms. We recommend reviewing this document regularly.</p>

                    <h3>16. Termination</h3>
                    <p>We reserve the right to suspend or terminate your access to Upshift at our sole discretion, without prior notice, for violation of these Terms or any applicable laws.</p>

                    <h3>17. Governing Law</h3>
                    <p>These Terms and Conditions are governed by and construed in accordance with the laws of [Your Country/Region], without regard to its conflict of law provisions.</p>
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

export default Terms;
