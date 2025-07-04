# Security Notice

## AWS Credentials Removal

AWS credentials were accidentally committed to the repository history. These have been removed from the current code, but still exist in git history.

### Immediate Actions Taken:
1. Removed hardcoded credentials from `src/config/aws.ts`
2. Updated code to use environment variables only
3. Created `.env.example` file for configuration reference

### Required Actions:
1. **Rotate AWS Credentials Immediately** - The exposed credentials should be considered compromised
2. **Clean Git History** - Use BFG Repo-Cleaner or git-filter-repo to remove secrets from history
3. **Force Push** - After cleaning history, force push to update remote

### How to Clean History:
```bash
# Using BFG (recommended)
bfg --replace-text passwords.txt repo.git

# Or using git-filter-repo
git filter-repo --path eb-world-builder/src/config/aws.ts --invert-paths
```

### Going Forward:
- Never commit credentials
- Always use environment variables
- Add `.env` to `.gitignore`
- Use GitHub Secrets for CI/CD