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
    
    # Friendly name for the query
    payload = {
        "fb_api_req_friendly_name": "PolarisPostRootQuery",
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
        "server_payload": "false",
        "doc_id": "10015921899073305" # This doc_id might change, but let's try it.
    }
    
    response = requests.post(url, headers=headers, data=payload)
    return response.json()

if __name__ == "__main__":
    test_shortcode = "C6X3e_0M-6B"
    data = get_reel_data(test_shortcode)
    print(json.dumps(data, indent=2))
