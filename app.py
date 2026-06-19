import os
import re
import html
import logging
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NAMESPACE = {'atom': 'http://www.w3.org/2005/Atom'}

def parse_entry_content(content_html):
    """
    Extracts the category (from <h3>) and body content from the raw HTML content.
    Also produces a plain text version for social sharing.
    """
    if not content_html:
        return "General", "", ""
    
    content_html = content_html.strip()
    
    # Extract Category from <h3> tag
    category_match = re.search(r'<h3>(.*?)</h3>', content_html, re.IGNORECASE)
    if category_match:
        category = category_match.group(1).strip()
        # Remove the <h3> tag for clean display of the body
        body_html = re.sub(r'<h3>.*?</h3>', '', content_html, count=1, flags=re.IGNORECASE).strip()
    else:
        category = "General"
        body_html = content_html

    # Generate clean text (remove HTML tags and decode HTML entities)
    clean_text = re.sub(r'<[^>]+>', '', body_html)
    clean_text = html.unescape(clean_text)
    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
    
    return category, body_html, clean_text

def fetch_and_parse_feed():
    """
    Fetches the BigQuery Release Notes RSS/Atom feed and parses it into a list of dictionaries.
    """
    try:
        logger.info(f"Fetching BigQuery release notes from: {FEED_URL}")
        response = requests.get(FEED_URL, timeout=15)
        response.raise_for_status()
        
        root = ET.fromstring(response.content)
        entries = root.findall('atom:entry', ATOM_NAMESPACE)
        
        parsed_entries = []
        for index, entry in enumerate(entries):
            entry_id = entry.find('atom:id', ATOM_NAMESPACE)
            title = entry.find('atom:title', ATOM_NAMESPACE)
            updated = entry.find('atom:updated', ATOM_NAMESPACE)
            content = entry.find('atom:content', ATOM_NAMESPACE)
            
            raw_id = entry_id.text if entry_id is not None else f"note-{index}"
            date_str = title.text if title is not None else "Unknown Date"
            updated_str = updated.text if updated is not None else ""
            raw_content = content.text if content is not None else ""
            
            category, body_html, clean_text = parse_entry_content(raw_content)
            
            parsed_entries.append({
                "id": raw_id,
                "date": date_str,
                "updated": updated_str,
                "category": category,
                "body_html": body_html,
                "clean_text": clean_text
            })
            
        logger.info(f"Successfully parsed {len(parsed_entries)} entries.")
        return parsed_entries, None
    except requests.RequestException as e:
        logger.error(f"Network error fetching feed: {e}")
        return [], f"Network error: Unable to fetch release notes feed. ({str(e)})"
    except ET.ParseError as e:
        logger.error(f"XML Parsing error: {e}")
        return [], "XML Parsing error: The feed content is invalid."
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return [], f"An unexpected error occurred: {str(e)}"

@app.route('/')
def index():
    """Renders the main single-page application dashboard."""
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    """API endpoint to get the BigQuery release notes."""
    entries, error = fetch_and_parse_feed()
    if error:
        return jsonify({
            "success": False,
            "error": error,
            "data": []
        }), 500
    
    return jsonify({
        "success": True,
        "error": None,
        "data": entries
    })

if __name__ == '__main__':
    # Using port 5000 as default for Flask development
    app.run(host='127.0.0.1', port=5000, debug=True)
