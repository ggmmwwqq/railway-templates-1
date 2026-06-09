ARG PB_VERSION=0.23.12

FROM alpine:3.21 AS downloader
RUN apk add --no-cache wget unzip ca-certificates
RUN wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" \
    -O /tmp/pb.zip && \
    unzip -q /tmp/pb.zip -d /tmp/pb && \
    mv /tmp/pb/pocketbase /usr/local/bin/pocketbase && \
    chmod +x /usr/local/bin/pocketbase && \
    rm -rf /tmp/pb.zip /tmp/pb

FROM alpine:3.21
RUN apk add --no-cache nodejs ca-certificates tzdata

COPY --from=downloader /usr/local/bin/pocketbase /usr/local/bin/pocketbase

RUN mkdir -p /pb_data
VOLUME /pb_data

COPY healthcheck/ /app/healthcheck/

ENV PORT=8080
ENV SIDECAR_PORT=8090
ENV PB_DATA_DIR=/pb_data

EXPOSE 8080
EXPOSE 8090

COPY start.sh /start.sh
RUN chmod +x /start.sh

ENTRYPOINT ["/start.sh"]
