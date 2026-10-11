import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined in environment variables");
}

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is not defined in environment variables");
}

if (!process.env.IMAGEKIT_PUBLIC_KEY) {
    throw new Error("IMAGEKIT_PUBLIC_KEY is not defined in environment variables");
}

if (!process.env.PINECONE_KEY) {
    throw new Error("PINECONE_KEY is not defined in environment variables");
}

if (!process.env.PINECONE_INDEX_NAME) {
    throw new Error("PINECONE_INDEX_NAME is not defined in environment variables");
}

if (!process.env.MISTRALAI_KEY) {
    throw new Error("MISTRALAI_KEY is not defined in environment variables");
}

export const config = {
    MONGO_URI: process.env.MONGO_URI || "",
    JWT_SECRET: process.env.JWT_SECRET || "",
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY || "",
    IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || "",
    PINECONE_KEY: process.env.PINECONE_KEY || "",
    PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || "",
    MISTRAL_KEY: process.env.MISTRALAI_KEY || "",
    MISTRAL_MODEL: process.env.MISTRAL_MODEL || "open-mistral-7b",
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || "default_secure_key_must_be_32byt",
}