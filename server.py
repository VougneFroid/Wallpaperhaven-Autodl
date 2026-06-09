import http.server
import socketserver
import urllib.request
import urllib.parse
import urllib.error
import json
import os
import time
import subprocess

PORT = 8000
PUBLIC_DIR = "public"
SETTINGS_FILE = "settings.json"
HISTORY_FILE = "history.json"
DOWNLOAD_DIR = "downloads"

# Load settings if exists
if os.path.exists(SETTINGS_FILE):
    try:
        with open(SETTINGS_FILE, "r") as f:
            settings = json.load(f)
            DOWNLOAD_DIR = settings.get("download_dir", DOWNLOAD_DIR)
    except Exception:
        pass

API_KEY = None

# Load API key from .env if it exists
if os.path.exists(".env"):
    with open(".env", "r") as f:
        for line in f:
            if line.startswith("API_KEY="):
                API_KEY = line.strip().split("=")[1].strip()

# Create download directory initial if it doesn't exist
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        if self.path.startswith("/api/search"):
            self.handle_search()
        elif self.path == "/api/settings":
            self.handle_settings_get()
        elif self.path == "/api/choose-folder":
            self.handle_choose_folder()
        elif self.path == "/api/history":
            self.handle_history()
        else:
            # Serve static files from public directory
            super().do_GET()

    def do_POST(self):
        if self.path == "/api/download":
            self.handle_download()
        elif self.path == "/api/settings":
            self.handle_settings_post()
        else:
            self.send_error(404, "Not Found")

    def handle_search(self):
        query = urllib.parse.urlparse(self.path).query
        
        # Build Wallhaven API URL
        api_url = f"https://wallhaven.cc/api/v1/search?{query}"
        
        req = urllib.request.Request(api_url, headers={'User-Agent': 'WallhavenAutoDL/1.0'})
        
        # Append API key if configured
        if API_KEY:
            if "?" in api_url:
                api_url += f"&apikey={API_KEY}"
            else:
                api_url += f"?apikey={API_KEY}"
            req = urllib.request.Request(api_url, headers={'User-Agent': 'WallhavenAutoDL/1.0'})
            
        try:
            with urllib.request.urlopen(req) as response:
                data = response.read()
                
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(data)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            error_data = {"error": str(e)}
            self.wfile.write(json.dumps(error_data).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def handle_settings_get(self):
        global DOWNLOAD_DIR
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"download_dir": DOWNLOAD_DIR}).encode())

    def handle_settings_post(self):
        global DOWNLOAD_DIR
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        try:
            data = json.loads(post_data)
            new_dir = data.get("download_dir")
            if new_dir:
                DOWNLOAD_DIR = new_dir
                with open(SETTINGS_FILE, "w") as f:
                    json.dump({"download_dir": DOWNLOAD_DIR}, f)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True}).encode())
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "Missing download_dir"}')
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def handle_history(self):
        history = []
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r") as f:
                    history = json.load(f)
            except Exception:
                pass
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(history).encode())

    def handle_choose_folder(self):
        try:
            result = subprocess.run(["kdialog", "--getexistingdirectory", os.path.expanduser("~")], capture_output=True, text=True)
            if result.returncode == 0 and result.stdout.strip():
                folder = result.stdout.strip()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"folder": folder}).encode())
            else:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "No folder selected"}')
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def handle_download(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data)
            url = data.get("url")
            id = data.get("id")
            
            if not url or not id:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b'{"error": "Missing url or id"}')
                return

            # Extract extension from url
            ext = os.path.splitext(urllib.parse.urlparse(url).path)[1]
            if not ext:
                ext = ".jpg"
                
            filename = f"wallhaven-{id}{ext}"
            
            # Ensure the directory exists before saving
            os.makedirs(DOWNLOAD_DIR, exist_ok=True)
            filepath = os.path.join(DOWNLOAD_DIR, filename)
            
            # Simple rate limiting protection: Add a small delay
            time.sleep(1.5)
            
            req = urllib.request.Request(url, headers={'User-Agent': 'WallhavenAutoDL/1.0'})
            with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                out_file.write(response.read())
                
            # Append to history
            history = []
            if os.path.exists(HISTORY_FILE):
                try:
                    with open(HISTORY_FILE, "r") as f:
                        history = json.load(f)
                except Exception:
                    pass
            if id not in history:
                history.append(id)
                with open(HISTORY_FILE, "w") as f:
                    json.dump(history, f)
                
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"success": True, "file": filename}).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at http://localhost:{PORT}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
