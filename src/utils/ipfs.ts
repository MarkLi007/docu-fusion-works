
import { create } from "ipfs-http-client";

// Configure your IPFS client
// The URL should be replaced with your IPFS node or a service like Infura or Pinata
const ipfsClient = create({ url: "http://47.79.16.191:5001/api/v0" });

export async function uploadToIPFS(file: File) {
  if (!file) throw new Error("No file provided");
  try {
    const result = await ipfsClient.add(file);
    // result.path is the CID
    return result.path;
  } catch (error) {
    console.error("IPFS upload error:", error);
    throw new Error("Failed to upload to IPFS: " + (error as Error).message);
  }
}

export function getIPFSGatewayUrl(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`;
}
