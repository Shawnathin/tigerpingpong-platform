# Intentionally NON-executable: official entrypoint sources this into its shell.
# This removes the source secret before entrypoint execs long-running postgres.
timeout --signal=TERM --kill-after=5s 300s python3 /job/copy_job.py
unset SOURCE_DB_PASSWORD PGPASSWORD
