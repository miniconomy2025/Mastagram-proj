#!/bin/sh

echo Running mongo migrations...
migrate-mongo up
echo Finished running mongo migrations

echo Starting server
npm run prod
