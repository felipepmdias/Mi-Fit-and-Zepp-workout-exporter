# Mi Fit and Zepp workout exporter

This repository contains a TypeScript implementation for exporting Mi Fit / Zepp workout data, based on the original Python reverse engineering work.

## Environment setup
```bash
npm install
npx tsc
```

## Usage
The script authenticates the user with the API then exports all workouts to the output directory using the specified file format (GPX or GeoJSON).

```bash
# Basic usage (auto-login)
node dist/index.js

# Full options
node dist/index.js [-h] [-e ENDPOINT] [-t TOKEN] [-f {gpx,geojson}] [-o OUTPUT_DIRECTORY] [--start-date START_DATE] [--end-date END_DATE]
```

### Examples
```bash
# Export to GeoJSON filtering by date
node dist/index.js -f geojson --start-date 2023-01-01 --end-date 2023-12-31

# Use manual token
node dist/index.js -t "YOUR_TOKEN_HERE"
```

## Acknowledgements 
The latitude/longitude parsing is based on Miroslav Bendík's [MiFitDataExport](https://github.com/mireq/MiFitDataExport) project.

## How to get the token manually
If the authentication does not work out of the box, you can also provide the token manually:

1. Open the [GDPR page](https://user.huami.com/privacy2/index.html?loginPlatform=web&platform_app=com.xiaomi.hm.health)
2. Click `Export data`
3. Sign in to your account
4. Open the developer tools in your browser (F12)
5. Select the `Network` tab
6. Click on `Export data` again
7. Look for any request containing the `apptoken` header or cookie
8. Pass the token to the script using the `-t` argument

<img src=".github/readme_files/zepp_token.jpg"/></img>
