import sys
import re
import os
import subprocess

def find_nginx_conf():
    search_dirs = ['/etc/nginx/sites-available', '/etc/nginx/sites-enabled']
    for d in search_dirs:
        if os.path.exists(d):
            for f in os.listdir(d):
                if 'toolnix' in f:
                    return os.path.join(d, f)
    return None

conf_path = find_nginx_conf()

if not conf_path:
    print("❌ Could not find toolnix Nginx configuration file!")
    sys.exit(1)

print(f"🔧 Found Nginx config at: {conf_path}")

with open(conf_path, 'r') as f:
    content = f.read()

original = content

# Add ^~ modifier to media and static blocks to prevent regex hijacking
content = re.sub(r'location\s+/media/\s*\{', 'location ^~ /media/ {', content)
content = re.sub(r'location\s+/static/\s*\{', 'location ^~ /static/ {', content)

if content == original:
    if '^~ /media/' in content:
        print("✅ Nginx config is already patched!")
    else:
        print("❌ Could not find the location blocks to patch. Please edit manually.")
else:
    with open(conf_path, 'w') as f:
        f.write(content)
    print("✅ Successfully patched Nginx config!")

print("🔄 Reloading Nginx...")
subprocess.run(['nginx', '-t'], check=True)
subprocess.run(['systemctl', 'reload', 'nginx'], check=True)
print("🎉 All done! Your images should now load.")
