import { Pinecone } from "@pinecone-database/pinecone"
import { config } from "./config.js";
const pc = new Pinecone({
    apiKey: config.PINECONE_KEY,
});

export const index = pc.Index(config.PINECONE_INDEX_NAME);