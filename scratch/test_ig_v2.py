import requests
import json
import re
from urllib.parse import quote

def extract_shortcode_from_url(url):
    """Extract shortcode from Instagram reel URL"""
    url = url.split('?')[0]
    match = re.search(r'instagram\.com/(?:[^/]+/)?(?:reel|p)/([^/?]+)', url)
    if not match:
        raise ValueError("Invalid Instagram URL format")
    return match.group(1)

def create_payload(shortcode):
    """Create payload with dynamic shortcode"""
    variables = json.dumps({"shortcode": shortcode})
    encoded_variables = quote(variables)

    # This is the exact payload string from seotanvirbd
    return f'av=0&__d=www&__user=0&__a=1&__req=u&__hs=20371.HYP%3Ainstagram_web_pkg.2.1...0&dpr=1&__ccg=GOOD&__rev=1028249517&__s=ywybjm%3Aq4co81%3Adplvd8&__hsi=7559456450740095677&__dyn=7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJw5ux609vCwjE1EE2Cw8G11wBz81s8hwGxu786a3a1YwBgao6C0Mo2swtUd8-U2zxe2GewGw9a361qw8Xxm16wa-0raazo7u3C2u2J0bS1LwTwKG0WE8oC1Iwqo5p0OwUQp1yU426V89F8uwm8jwhUaE4e1tyVrx60gm5oswFwtF85i5E&__csr=geIAaiFliZllsBav4trBuTJ-KJ5WhnQyAnxeEWpBCC-hJADG9AgG4qpQ8zat5BypWy9eaRgBaJ2Xx2p6WgymmGDzQjJo8JJ4iKi8xObCjx50FzLF4-8DiwxDyGqoydV-ESQ9DLAB_GdDzFEsyUSeG8xmF9oymWyqyVFF84q5ooHohwuE5a0CU01kUUb81CE12E5V08m0WFA0ei80n2bLwjp42TOw2J-0rq04tUKp06PwEhy1u1ig4Dgy9wdW0D8n80rl0UxGtw53hEx2E1yPUy7U1J9Q0JFvc0cXwpyG4B6B2US01IAw2Bo0K215w0YEwj8&__hsdp=gaQbh9gple4i4WuA2XCG7RVt5m8DxGU4K32awCF0GBcq1AyH40uWxe3AwboK5-0FE8UbkkU4-4o11XwQCyE9UswZweC4U6iq6UOewJyEhwBwjQ2259o1oE1E85u0km5Unw7Pwaau1CwMwkEeU1v82ew2rA0LoW0W8aO0Ewc6&__hblp=0nE20wpGx6vxy2i1ryE9Gg6q1hwkE9WwkocUso4O2vDyof98K7o4-48hDwyLBx61HwkGg8VoGqawDxCGBwQxG6S0I8jwywXBCxKczEqxaax62m1FDxim1nw4axq0oC362m0iu7ohBxu11wEwfm0AE421xDwhEvwxzEvG2-3K0nO0zE1MUK0DA1DwgEizEW0Qp-2Awa8nxyi1fwRBwFwau68bE&__comet_req=7&lsd=AdGtgRvhyjc&jazoest=21085&__spin_r=1028249517&__spin_b=trunk&__spin_t=1760073111&__crn=comet.igweb.PolarisLoggedOutDesktopPostRouteNext&fb_api_caller_class=RelayModern&fb_api_req_friendly_name=PolarisPostRootQuery&server_timestamps=true&variables={encoded_variables}&doc_id=24368985919464652'

def scrape_instagram_reel(url):
    """Main function to scrape Instagram reel data"""
    shortcode = extract_shortcode_from_url(url)
    
    session = requests.Session()
    session.headers.update({
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
    })
    
    # Get fresh cookies
    print("Fetching fresh cookies...")
    session.get(f"https://www.instagram.com/reels/{shortcode}/")
    csrf_token = session.cookies.get('csrftoken')
    
    payload = create_payload(shortcode)

    headers = {
        'accept': '*/*',
        'content-type': 'application/x-www-form-urlencoded',
        'x-csrftoken': csrf_token if csrf_token else 'YuvV-QRvpR2Ggzgk0cTg1T', # Fallback
        'x-ig-app-id': '936619743392459',
        'Referer': f"https://www.instagram.com/reels/{shortcode}/",
    }

    response = session.post("https://www.instagram.com/graphql/query", 
                           headers=headers, data=payload, timeout=10)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code != 200:
        return {"error": True, "message": f"HTTP error: {response.status_code}", "text": response.text[:500]}

    try:
        data = response.json()
        return {"error": False, "data": data}
    except:
        return {"error": True, "message": "Failed to parse JSON", "text": response.text[:500]}

if __name__ == "__main__":
    test_url = "https://www.instagram.com/reel/C6X3e_0M-6B/"
    result = scrape_instagram_reel(test_url)
    print("Result Keys:", result.keys())
    if not result['error']:
        print("Data Type:", type(result['data']))
        print("Data Content:", json.dumps(result['data'], indent=2)[:1000])
        
        if result['data']:
            items = result['data'].get('data', {}).get('xdt_api__v1__media__shortcode__web_info', {}).get('items', [])
            if items:
                item = items[0]
                print(f"Views: {item.get('play_count')}")
                print(f"Username: {item.get('user', {}).get('username')}")
            else:
                print("No items found in response")
        else:
            print("Data is None or Empty")
    else:
        print(f"Error: {result['message']}")
        print(result.get('text'))
