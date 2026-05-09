import requests
import json

def get_reel_data(shortcode):
    url = "https://www.instagram.com/graphql/query"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "x-ig-app-id": "936619743392459",
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "*/*",
        "Origin": "https://www.instagram.com",
        "Referer": f"https://www.instagram.com/reels/{shortcode}/",
    }
    
    # Using the doc_id from seotanvirbd
    payload = {
        "variables": json.dumps({
            "shortcode": shortcode,
            "fetch_comment_count": None,
            "fetch_related_profile_media_count": None,
            "parent_comment_count": None,
            "child_comment_count": None,
            "fetch_like_count": None,
            "fetch_tagged_user_count": None,
            "fetch_preview_comment_count": None,
            "has_threaded_comments": False,
            "hoisted_comment_id": None,
            "hoisted_reply_id": None
        }),
        "doc_id": "8845758582119845" # I'll try the one from the existing code first but with more headers if needed.
    }
    
    # Actually let's try the one I found in seotanvirbd
    payload_seotanvirbd = {
        "variables": json.dumps({"shortcode": shortcode}),
        "doc_id": "24368985919464652"
    }

    print(f"Testing with doc_id: {payload_seotanvirbd['doc_id']}")
    response = requests.post(url, headers=headers, data=payload_seotanvirbd)
    print(f"Status Code: {response.status_code}")
    try:
        return response.json()
    except:
        return response.text

if __name__ == "__main__":
    test_shortcode = "C6X3e_0M-6B"
    data = get_reel_data(test_shortcode)
    print(json.dumps(data, indent=2) if isinstance(data, dict) else data[:500])
