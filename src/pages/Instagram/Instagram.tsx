import { useEffect } from 'react';

const Instagram: React.FC = () => {
    useEffect(() => {
        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

        // Detect iOS (iPhone/iPad)
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;

        // Detect Android
        const isAndroid = /android/i.test(userAgent);

        // Redirect based on device
        if (isIOS) {
            // Redirect to Apple App Store
            window.location.href = 'https://apps.apple.com/us/app/upshift-level-up-your-life/id6749509316';
        } else if (isAndroid) {
            // Redirect to Google Form
            window.location.href = 'https://forms.gle/iJa3K3p6LmWkmHxn6#';
        } else {
            // Redirect to main page for everything else (Windows, Linux, macOS)
            window.location.href = 'https://joinupshift.com/';
        }
    }, []);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#333'
        }}>
            <div style={{ textAlign: 'center' }}>
                <h2>Redirecting...</h2>
                <p>Please wait while we redirect you to the right place.</p>
            </div>
        </div>
    );
};

export default Instagram;
