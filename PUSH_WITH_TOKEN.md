# Quick Guide: Push to GitHub with Personal Access Token

## Step 1: Generate Personal Access Token

1. **Open this link in your browser:**
   https://github.com/settings/tokens/new

2. **Fill in the form:**
   - **Note:** "Railway Deploy - Next.js Frontend"
   - **Expiration:** 30 days (or longer if you prefer)
   - **Select scopes:** Check the box for `repo` (this gives full control of private repositories)

3. **Click "Generate token"** at the bottom

4. **COPY THE TOKEN** - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ⚠️ You won't see it again after closing the page!

---

## Step 2: Push Using Token

Once you have the token, run this command in your terminal:

```bash
cd /Users/abhijithca/Documents/GitHub/gamespotweb
git push https://YOUR_TOKEN_HERE@github.com/Azonix07/gamespotbooking-v1.git main
```

**Replace `YOUR_TOKEN_HERE` with the actual token you copied.**

Example:
```bash
git push https://ghp_ABC123xyz789ABC123xyz789ABC123xyz789@github.com/Azonix07/gamespotbooking-v1.git main
```

---

## What Happens Next

1. ✅ Git will push 4 commits to GitHub (takes 10-20 seconds)
2. ✅ GitHub receives the `next-frontend` folder
3. ✅ Railway automatically detects the push via webhook
4. ✅ Railway starts building from `next-frontend` directory
5. ✅ Your site goes live in ~3 minutes 🚀

---

## Alternative: Cache Credentials (So You Don't Need Token Every Time)

After the first push with token, you can save credentials:

```bash
# Save credentials for 1 hour
git config --global credential.helper 'cache --timeout=3600'

# Or save permanently in macOS Keychain
git config --global credential.helper osxkeychain
```

Then just use:
```bash
git push origin main
```

And enter the token once when prompted - it will be saved.

---

## Ready?

1. ✅ Open: https://github.com/settings/tokens/new
2. ✅ Generate token with `repo` scope
3. ✅ Copy the token
4. ✅ Run the push command with your token
5. ✅ Watch Railway deploy! 🚀
