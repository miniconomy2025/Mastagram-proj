import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
dotenv.config();

export const esClient = new Client({
	node: process.env.ES_NODE_URL!,
	auth: {
		apiKey: process.env.ES_API_KEY!,
	},
	serverMode: 'serverless',
	// requestTimeout: 480000,
});
