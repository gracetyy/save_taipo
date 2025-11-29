import re
from urllib.parse import unquote

def optimize_link(url: str):
    # 1. Extract Data Payload
    data_match = re.search(r'(data=.*)', url)
    if not data_match:
        return None, None, None, "Error: Input URL does not contain 'data=' segment."
    data_payload = data_match.group(1)

    # 2. Extract Pin Coordinates (!3d, !4d)
    lat_match = re.search(r'!3d(-?\d+\.\d+)', data_payload)
    lng_match = re.search(r'!4d(-?\d+\.\d+)', data_payload)

    if not lat_match or not lng_match:
        return None, None, None, "Error: Could not find valid pin coordinates (!3d/!4d) in the URL."

    real_lat = lat_match.group(1)
    real_lng = lng_match.group(1)

    # 3. Extract and Decode Place Name
    name_match = re.search(r'/place/([^/@]+)', url)
    if name_match:
        raw_name = name_match.group(1)
        place_name = unquote(raw_name).replace(' ', '+')
    else:
        place_name = f"{real_lat},{real_lng}"

    # 4. Construct New URL with Max Zoom (21z) & Centered Origin
    new_url = (
        f"https://www.google.com/maps/place/{place_name}/"
        f"@{real_lat},{real_lng},21z/"
        f"{data_payload}"
    )

    return real_lat, real_lng, new_url, None


def main():
    print("--- Google Maps Link Optimizer (Ctrl+C to exit) ---\n")
    while True:
        try:
            url = input("Paste Google Maps link (or leave blank to skip):\n").strip()
            if not url:
                print("No URL entered. Try again.\n")
                continue

            lat, lng, new_url, err = optimize_link(url)

            if err:
                print(err + "\n")
                continue

            print("\n--- Output ---")
            print(f"    lat: {lat},")
            print(f"    lng: {lng},")
            print(f'    mapLink: "{new_url}",\n')

        except KeyboardInterrupt:
            print("\n\nExiting on user request (Ctrl+C).")
            break
        except EOFError:
            print("\nEOF detected. Exiting.")
            break

if __name__ == "__main__":
    main()
