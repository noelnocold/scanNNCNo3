# scan-code

Simple utility to scan project files for patterns and produce a summary report.

## Features
- Scan directories recursively
- Match files by glob or extension
- Search for regex or fixed-string patterns
- Output results to console or file

## Requirements
- Node.js >= 14 (or specify runtime used)
- Optional: grep/similar tools if wrapping native utilities

## Installation
Clone the repo and install dependencies:
```bash
git clone <repo-url>
cd scan-code
npm install
```

## Usage
Basic run:
```bash
npm start -- --path ./src --pattern "TODO|FIXME" --out report.json
```
Options:
- --path : directory to scan
- --pattern : regex or string to search
- --out : optional output file

## Contributing
Open an issue or submit a pull request. Follow repository coding style and add tests for new features.

## License
Specify a license (e.g., MIT) in LICENSE file.