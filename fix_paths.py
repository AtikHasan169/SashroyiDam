import os
import shutil
from pathlib import Path

ROOT = Path(".").resolve()

def fix_nested_structure():
    print("🔧 Fixing nested folder paths...")

    # 1. Fix ./app/admin/admin -> ./app/admin
    nested_admin = ROOT / "app/admin/admin"
    actual_admin = ROOT / "app/admin"
    if nested_admin.exists():
        for item in nested_admin.iterdir():
            target = actual_admin / item.name
            if target.exists():
                if item.is_dir():
                    shutil.rmtree(target)
                else:
                    target.unlink()
            shutil.move(str(item), str(target))
            print(f"Moved: {item.relative_to(ROOT)} -> {target.relative_to(ROOT)}")
        shutil.rmtree(nested_admin)

    # 2. Flatten ./app/storefront/* directly into ./app/
    storefront_dir = ROOT / "app/storefront"
    if storefront_dir.exists():
        for item in storefront_dir.iterdir():
            target = ROOT / "app" / item.name
            if target.exists():
                if item.is_dir():
                    shutil.rmtree(target)
                else:
                    target.unlink()
            shutil.move(str(item), str(target))
            print(f"Flattened: {item.relative_to(ROOT)} -> {target.relative_to(ROOT)}")
        shutil.rmtree(storefront_dir)

    # 3. Ensure tsconfig.json exists with correct path alias
    tsconfig_path = ROOT / "tsconfig.json"
    tsconfig_content = """{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
"""
    tsconfig_path.write_text(tsconfig_content, encoding="utf-8")
    print("✅ Created/Verified tsconfig.json")

    # 4. Ensure next.config.mjs exists
    next_config_path = ROOT / "next.config.mjs"
    if not next_config_path.exists():
        next_config_content = """/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
"""
        next_config_path.write_text(next_config_content, encoding="utf-8")
        print("✅ Created next.config.mjs")

    print("\n🎉 Path restructuring complete!")

if __name__ == "__main__":
    fix_nested_structure()
