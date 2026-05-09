// Node 22 has built-in fetch


async function test() {
    const shortcode = "C6X3e_0M-6B";
    const appId = "936619743392459";
    
    // 1. Fetch Reel Info
    console.log("Fetching Reel Info...");
    const reelRes = await fetch("https://www.instagram.com/graphql/query", {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "x-ig-app-id": appId
        },
        body: new URLSearchParams({
            doc_id: "8845758582119845",
            variables: JSON.stringify({
                shortcode: shortcode,
                fetch_tagged_user_count: null,
                hoisted_comment_id: null,
                hoisted_reply_id: null
            })
        })
    });
    
    const reelData = await reelRes.json();
    console.log("Reel Data:", JSON.stringify(reelData, null, 2));
    
    const username = reelData?.data?.xdt_shortcode_media?.owner?.username;
    if (!username) {
        console.error("Could not find username");
        return;
    }
    
    // 2. Fetch Profile Info
    console.log(`Fetching Profile Info for ${username}...`);
    const profileRes = await fetch(`https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "x-ig-app-id": appId
        }
    });
    
    const profileData = await profileRes.json();
    console.log("Profile Data:", JSON.stringify(profileData, null, 2));
}

test();
