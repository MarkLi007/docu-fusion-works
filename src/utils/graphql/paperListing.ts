
import { gql } from '@apollo/client';
import { client } from './client';
import { getPaperStatus } from './paperStatus';
import { getContractReadOnly } from '../contract';

// Query to get all papers
export async function getAllPapers() {
  try {
    // Query PaperSubmitted events which contain paper information
    const { data } = await client.query({
      query: gql`
        query {
          paperSubmitteds(first: 100, orderBy: timestamp, orderDirection: desc) {
            id
            paperId
            title
            author
            ipfsHash
            timestamp
            signature
            blockNumber
            blockTimestamp
            transactionHash
          }
        }
      `
    });

    // Transform the data to match the expected format
    return data.paperSubmitteds.map((paper: any) => ({
      id: paper.paperId.toString(),
      title: paper.title,
      author: paper.author,
      status: getPaperStatus(paper.paperId.toString()), // Need to check status separately
      timestamp: paper.timestamp,
      owner: "", // This needs to be filled from contract call if needed
      versions: [
        {
          versionIndex: 0,
          ipfsHash: paper.ipfsHash,
          timestamp: paper.timestamp
        }
      ]
    }));
  } catch (error) {
    console.error("Error fetching papers:", error);
    return [];
  }
}
