# Privacy Policy for Koneczny Civilization Analyzer

*Last updated: November 17, 2026*

This Privacy Policy describes how the **Koneczny Civilization Analyzer** Chrome Extension ("the Extension") collects, uses, and protects your information.

## 1. Single Purpose & Nature of the Extension
The Extension is a research and educational text-analysis tool based on the comparative historiosophical methodology of Prof. Feliks Koneczny (1862–1949). It evaluates textual structures (such as public laws, historical articles, and constitutions) for comparative civilizational indicators.

## 2. Information Collected and Handled

### A. Gemini API Key
- **Storage:** If you provide a Google Gemini API Key, it is stored strictly locally on your machine via `chrome.storage.local`.
- **Transmission:** Your API Key is transmitted solely over encrypted HTTPS connections directly to the official Google Gemini API endpoint (`https://generativelanguage.googleapis.com/*`) to authenticate your text analysis requests. It is never transmitted to, logged by, or shared with the author of this extension or any other third party.

### B. Analyzed Website Content
- **Collection:** When you explicitly click to analyze a page or document, the extension extracts the readable textual content of the current tab.
- **Processing:** The extracted text is sent directly to the Google Gemini API to evaluate indicators according to Koneczny's methodology.
- **No Background Tracking:** The extension does **not** passively monitor, record, log, or transmit your browsing history or keystrokes. Analysis is triggered only upon direct user request.

### C. Local History and Analysis Results
- Analysis results, calculated scores, and timestamped URL entries are stored strictly locally in your browser (`chrome.storage.local`) to render charts and historical comparisons. You can clear this data at any time by clearing extension storage or uninstalling the extension.

## 3. Data Sharing & Third-Party Services
- The only external service interacting with the extension is the **Google Gemini API** (`generativelanguage.googleapis.com`), operated by Google LLC. Data sent to Google is subject to Google's [API Terms of Service](https://ai.google.dev/terms) and [Privacy Policy](https://policies.google.com/privacy).
- We do **not** sell, rent, trade, or monetize your data, browsing history, or API keys.
- We do **not** use your data for advertising, credit scoring, or tracking across sites.

## 4. Google Chrome Web Store User Data Compliance (Limited Use)
The Extension adheres to the **Google Chrome Web Store Developer Program Policies**, including the **Limited Use** requirements:
- Use of data is limited exclusively to providing the user-facing text analysis features of the Extension.
- Data transfers are strictly limited to direct communications with the AI endpoint requested by the user.
- No personal data or website contents are ever transferred to data brokers or advertising networks.

## 5. Security
All communication with external AI services occurs via Transport Layer Security (HTTPS). All storage operations utilize isolated browser extension APIs (`chrome.storage.local`), inaccessible to scripts running on regular web pages.

## 6. Contact
For any questions regarding this Privacy Policy or the Extension, please submit an issue on the project's official GitHub repository.
