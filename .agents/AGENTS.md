# Onepage-Masajes Rules

These are local rules and configurations specific to the Onepage-Masajes repository.

## Start Local Server Automatically

Every time a session is initialized in this workspace, the agent MUST ensure that the local development server is running in the background.

- **Check if running**: Check if there is already a process running the local server.
- **Run command**: If not running, execute `npm run dev` in the root of the workspace (`f:/Onepage-Masajes`) using `run_command` in the background (asynchronous).
- **Port**: The server runs on http://localhost:3000.
