# Findings & Decisions

## Requirements
- Move `.git` from `whatsapp-clone\whatsapp-clone\.git` to `c:\Users\Rahul\OneDrive\Desktop\Whatsapp\.git` (workspace root).
- Create `whatsapp-backend` and `whatsapp-frontend-temp` folders in workspace root.
- Move backend files (all contents of `whatsapp-clone\whatsapp-clone\` except `.git`) to `whatsapp-backend`.
- Delete the old nested `whatsapp-clone` folder.
- Move frontend files:
  - Move contents of existing `whatsapp-frontend` (except `.git`) to `whatsapp-frontend-temp`
  - Remove any `.git` folder in `whatsapp-frontend` if exists
  - Remove old `whatsapp-frontend` folder
  - Rename `whatsapp-frontend-temp` to `whatsapp-frontend`
- Move `docker-compose.yml` to the root workspace directory if it is not already there.
- Update `docker-compose.yml` build path for `app` to `./whatsapp-backend` (line 54).
- Commit directory changes: `git add -A` and `git commit -m "chore: restructure workspace into monorepo"`.

## Research Findings
- The directory `c:\Users\Rahul\OneDrive\Desktop\Whatsapp` has two subdirectories initially: `whatsapp-clone` and `whatsapp-frontend`.
- Inside `whatsapp-clone`, there is a nested `whatsapp-clone` subdirectory which contains the backend source, including `.git` and `docker-compose.yml`.
- Inside `whatsapp-frontend`, there is a frontend React app, which also contains a `.git` folder.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Use PowerShell command lines for restructuring | Target machine is Windows, so PowerShell commands specified in the user request will be run |
| Clean up planning files before final commit | To avoid committing temporary planning files unless requested |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| - | - |

## Resources
- Workspace path: `c:\Users\Rahul\OneDrive\Desktop\Whatsapp`
- Backend path: `c:\Users\Rahul\OneDrive\Desktop\Whatsapp\whatsapp-clone\whatsapp-clone`
- Frontend path: `c:\Users\Rahul\OneDrive\Desktop\Whatsapp\whatsapp-frontend`
