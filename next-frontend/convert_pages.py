#!/usr/bin/env python3
"""
Convert React JSX pages to Next.js TSX client components.
Handles import path changes and adds 'use client' directive.
"""
import re
import os

FRONTEND_PAGES = '/Users/abhijithca/Documents/GitHub/gamespotweb/frontend/src/pages'
NEXT_COMPONENTS = '/Users/abhijithca/Documents/GitHub/gamespotweb/next-frontend/src/app'

# Mapping: original page -> next-frontend route folder
PAGE_MAP = {
    'BookingPage.jsx': 'booking',
    'GamesPage.jsx': 'games',
    'MembershipPlansPage.jsx': 'membership',
    'ProfilePage.jsx': 'profile',
    'ContactPage.jsx': 'contact',
    'FeedbackPage.jsx': 'feedback',
    'UpdatesPage.jsx': 'updates',
    'RentalPage.jsx': 'rental',
    'CollegeSetupPage.jsx': 'college-setup',
    'DiscountGamePage.jsx': 'discount-game',
    'InstagramPromoPage.jsx': 'instagram-promo',
    'InvitePage.jsx': 'invite',
    'GetOffersPage.jsx': 'get-offers',
    'ForgotPasswordPage.jsx': 'forgot-password',
    'VerifyEmailPage.jsx': 'verify-email',
    'AdminDashboard.jsx': 'admin/dashboard',
}

# Import replacements
IMPORT_REPLACEMENTS = [
    # React Router -> Next.js
    (r"import\s*\{[^}]*\}\s*from\s*'react-router-dom';?\n?", ''),
    (r"from\s*'react-router-dom'", "from 'next/navigation'"),
    
    # Local imports -> @/ alias
    (r"from\s*'\.\.\/services\/api'", "from '@/services/api'"),
    (r"from\s*'\.\.\/services\/apiClient'", "from '@/services/apiClient'"),
    (r"from\s*'\.\.\/services\/ai-api'", "from '@/services/ai-api'"),
    (r"from\s*'\.\.\/services\/rawgApi'", "from '@/services/rawgApi'"),
    (r"from\s*'\.\.\/context\/AuthContext'", "from '@/context/AuthContext'"),
    (r"from\s*'\.\.\/utils\/helpers'", "from '@/utils/helpers'"),
    (r"from\s*'\.\.\/hooks\/useFreePlaces'", "from '@/hooks/useFreePlaces'"),
    (r"from\s*'\.\.\/hooks\/usePageTracking'", "from '@/hooks/usePageTracking'"),
    (r"from\s*'\.\.\/translations\/malayalam'", "from '@/translations/malayalam'"),
    
    # Component imports -> @/ alias
    (r"from\s*'\.\.\/components\/Navbar'", "from '@/components/Navbar'"),
    (r"from\s*'\.\.\/components\/Footer'", "from '@/components/Footer'"),
    (r"from\s*'\.\.\/components\/AIChat'", "from '@/components/AIChat'"),
    (r"from\s*'\.\.\/components\/ModernDatePicker'", "from '@/components/ModernDatePicker'"),
    (r"from\s*'\.\.\/components\/ThemeSelector'", "from '@/components/ThemeSelector'"),
    (r"from\s*'\.\.\/components\/LatestUpdates'", "from '@/components/LatestUpdates'"),
    (r"from\s*'\.\.\/components\/ProtectedRoute'", "from '@/components/ProtectedRoute'"),
    
    # Style imports -> @/ alias  
    (r"import\s*'\.\.\/styles\/([^']+)';?\n?", r"import '@/styles/\1';\n"),
    
    # Lazy import paths
    (r"import\('\.\.\/components\/", "import('@/components/"),
]

# Code replacements for React Router -> Next.js
CODE_REPLACEMENTS = [
    # useNavigate -> useRouter  
    (r'const\s+navigate\s*=\s*useNavigate\(\);?', 'const router = useRouter();'),
    # navigate('/path') -> router.push('/path')
    (r'navigate\(([\'"][^"\']+[\'"])\)', r'router.push(\1)'),
    # navigate('/path', { replace: true }) -> router.replace('/path')
    (r"navigate\((['\"][^\"']+['\"])\s*,\s*\{\s*replace\s*:\s*true\s*\}\s*\)", r"router.replace(\1)"),
    # useLocation -> usePathname + useSearchParams
    (r'const\s+location\s*=\s*useLocation\(\);?', 'const pathname = usePathname();\n  const searchParams = useSearchParams();'),
    # location.pathname -> pathname
    (r'location\.pathname', 'pathname'),
    # location.state?.from -> searchParams.get('from')
    (r"location\.state\?\.(from|from\.pathname)", "searchParams.get('from')"),
    (r"location\.state\?.from", "(searchParams.get('from') || '/')"),
    # <Link to= -> <Link href=
    (r'<Link\s+to=', '<Link href='),
    # Remove Navbar and Footer imports (provided by layout)
    (r"import\s+Navbar\s+from\s*'@\/components\/Navbar';?\n?", ''),
    (r"import\s+Footer\s+from\s*'@\/components\/Footer';?\n?", ''),
    # Remove <Navbar .../> and <Footer .../> from JSX (they're in the layout now)
    (r'\s*<Navbar\s*[^/]*/?>\s*\n?', '\n'),
    (r'\s*<Footer\s*[^/]*/?>\s*\n?', '\n'),
]

def convert_page(jsx_path, route_folder):
    """Convert a single JSX page to TSX for Next.js"""
    with open(jsx_path, 'r') as f:
        content = f.read()
    
    # Add 'use client' directive
    content = "'use client';\n\n" + content
    
    # Apply import replacements
    for pattern, replacement in IMPORT_REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    
    # Apply code replacements
    for pattern, replacement in CODE_REPLACEMENTS:
        content = re.sub(pattern, replacement, content)
    
    # Add necessary Next.js imports if navigate was used
    if 'router.push' in content or 'router.replace' in content:
        if "from 'next/navigation'" not in content:
            content = content.replace("'use client';", "'use client';\n\nimport { useRouter, usePathname, useSearchParams } from 'next/navigation';", 1)
        # Make sure useRouter is in the import
        if 'useRouter' not in content and 'router.' in content:
            content = content.replace("from 'next/navigation'", "{ useRouter } from 'next/navigation'")
    
    # Add Link import if <Link href= is used
    if '<Link href=' in content and "from 'next/link'" not in content:
        content = content.replace("'use client';", "'use client';\n\nimport Link from 'next/link';", 1)
    
    # Fix: remove any duplicate react-router-dom imports that weren't caught
    content = re.sub(r"import\s*\{[^}]*useNavigate[^}]*\}\s*from\s*'react-router-dom';?\n?", '', content)
    content = re.sub(r"import\s*\{[^}]*useLocation[^}]*\}\s*from\s*'react-router-dom';?\n?", '', content)
    content = re.sub(r"import\s*\{[^}]*Link[^}]*\}\s*from\s*'react-router-dom';?\n?", '', content)
    content = re.sub(r"import\s*\{[^}]*Navigate[^}]*\}\s*from\s*'react-router-dom';?\n?", '', content)
    
    # Ensure Next.js navigation imports are added
    needs_router = 'useRouter()' in content or 'router.push' in content or 'router.replace' in content
    needs_pathname = 'usePathname()' in content or 'pathname' in content
    needs_searchparams = 'useSearchParams()' in content or 'searchParams' in content
    
    nav_imports = []
    if needs_router: nav_imports.append('useRouter')
    if needs_pathname: nav_imports.append('usePathname')
    if needs_searchparams: nav_imports.append('useSearchParams')
    
    if nav_imports and "from 'next/navigation'" not in content:
        import_line = f"import {{ {', '.join(nav_imports)} }} from 'next/navigation';\n"
        content = content.replace("'use client';\n", f"'use client';\n\n{import_line}", 1)
    
    # Write to the Next.js route folder
    out_dir = os.path.join(NEXT_COMPONENTS, route_folder)
    os.makedirs(out_dir, exist_ok=True)
    
    # Extract the component name from the export
    component_match = re.search(r'export\s+default\s+(\w+)', content)
    component_name = component_match.group(1) if component_match else 'PageClient'
    
    # Write as ClientComponent.tsx
    out_path = os.path.join(out_dir, f'{component_name}Client.tsx')
    with open(out_path, 'w') as f:
        f.write(content)
    
    print(f"✅ Converted {os.path.basename(jsx_path)} -> {out_path}")
    return component_name, out_path

# Convert all pages
for jsx_file, route in PAGE_MAP.items():
    jsx_path = os.path.join(FRONTEND_PAGES, jsx_file)
    if os.path.exists(jsx_path):
        try:
            name, path = convert_page(jsx_path, route)
            print(f"   Component: {name}")
        except Exception as e:
            print(f"❌ Error converting {jsx_file}: {e}")
    else:
        print(f"⚠️ Not found: {jsx_path}")

print("\n✅ All pages converted!")
