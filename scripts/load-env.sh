#!/bin/bash

# Load environment variables from .env.root.local
npx ts-node scripts/load-env.ts

# Execute the remaining arguments as the next command
"$@"