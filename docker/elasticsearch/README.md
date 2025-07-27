# Elasticsearch & Kibana Docker Setup

This directory contains a `docker-compose.yml` file to run Elasticsearch and Kibana for local development and testing.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) installed
- [Docker Compose](https://docs.docker.com/compose/install/) installed

## How to Run

1. **Navigate to this directory:**

   ```sh
   cd docker/elasticsearch
   ```

2. **Start the services:**

   ```sh
   docker-compose up -d
   ```

   This will start:
   - **Elasticsearch** (available at [http://localhost:9200](http://localhost:9200))
   - **Kibana** (available at [http://localhost:5601](http://localhost:5601))

3. **Stop the services:**

   ```sh
   docker-compose down
   ```

## Notes

- Data is persisted in the `esdata` Docker volume.
- Security is disabled for local development.
- If you need to reset all data, remove the volume:

   ```sh
   docker volume rm docker_elasticsearch_esdata
   ```
## Troubleshooting

- Ensure no other services are running on ports `9200` or `5601`.
- If you encounter memory issues, make sure Docker has at least 2GB of RAM allocated.
