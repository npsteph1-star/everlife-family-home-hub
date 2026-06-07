# Backup before making repository private

Repository: everlife-family-home-hub
Date: 2026-06-07
Latest commit: 42845f8 (feat: Calendar, Education, Settings pages — MVP complete, all 20 phases done)

## Branches
- main (default)
- backup-before-private (snapshot branch created before making the repository private)

## Tags
- v0.1-pre-private (release tag for pre-private backup)

## Restore instructions
To restore this backup after making the repository private:

1. Clone the repository.
2. Checkout the backup branch:
   ```
   git checkout backup-before-private
   ```
   This branch is identical to the main branch at the time of backup.

3. Alternatively, checkout the tag:
   ```
   git checkout v0.1-pre-private
   ```
   Tags are immutable snapshots and can be used to create a new branch.

4. If the main branch is lost or corrupted, you can create a new main branch from the backup branch:
   ```
   git checkout -b main backup-before-private
   git push -f origin main
   ```

Ensure that you have appropriate permissions to push to the repository.
