# Official Docker Hub multiarch digest verified read-only October6,2026.
FROM postgres:17.11-bookworm@sha256:3645570cccdfa447589da9f57dd740faa29b30938e861289a5574b6ca6b03826 AS base
RUN apt-get update && apt-get install -y --no-install-recommends python3 ca-certificates && rm -rf /var/lib/apt/lists/*
FROM base AS synthetic-proof
COPY deploy/railway/copy-job/copy_job.py deploy/railway/copy-job/check_marker.py deploy/railway/copy-job/test_job.py deploy/railway/copy-job/init-copy.sh /job/
RUN chmod 0755 /job && chmod 0644 /job/*
USER postgres
ENV TIGER_SYNTHETIC_PG_BIN=/usr/lib/postgresql/17/bin
RUN python3 /job/test_job.py && printf 'PG17 synthetic integration gate passed\n' > /tmp/tiger-pg17-proof
FROM base AS runtime
COPY --from=synthetic-proof /tmp/tiger-pg17-proof /job/pg17-synthetic-proof
COPY deploy/railway/copy-job/copy_job.py deploy/railway/copy-job/check_marker.py /job/
COPY deploy/railway/copy-job/source-root-ca.crt /job/source-root-ca.crt
COPY deploy/railway/copy-job/init-copy.sh /docker-entrypoint-initdb.d/50-tiger-copy.sh
COPY deploy/railway/copy-job/start.sh /job/start.sh
RUN chmod 0644 /docker-entrypoint-initdb.d/50-tiger-copy.sh && chmod 0755 /job/start.sh
ENV POSTGRES_DB=tiger_rehearsal
ENV POSTGRES_INITDB_ARGS="--encoding=UTF8 --locale-provider=icu --icu-locale=en-US --locale=en_US.UTF-8"
ENTRYPOINT ["/job/start.sh"]
CMD ["postgres"]
