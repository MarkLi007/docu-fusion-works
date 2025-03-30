
import { gql } from '@apollo/client';
import { client } from './client';
import { getPaperStatus } from './paperStatus';

// Query to get pending papers (for admins)
export async function getPendingPapers() {
  try {
    // Get all paper submissions
    const { data } = await client.query({
      query: gql`
        query {
          paperSubmitteds(first: 100, orderBy: timestamp, orderDirection: desc) {
            paperId
            title
            author
            ipfsHash
            timestamp
          }
        }
      `
    });
    
    // Filter for pending papers (those without approval/rejection events)
    const pendingPapers = await Promise.all(
      data.paperSubmitteds.map(async (paper: any) => {
        const paperStatus = await getPaperStatus(paper.paperId.toString());
        
        // Only include pending papers
        if (paperStatus === 0) {
          return {
            paperId: Number(paper.paperId),
            title: paper.title,
            author: paper.author,
            timestamp: Number(paper.timestamp),
            ipfsHash: paper.ipfsHash,
            owner: "", // Would need separate query to get this
          };
        }
        return null;
      })
    );
    
    // Remove null entries
    return pendingPapers.filter(paper => paper !== null);
  } catch (error) {
    console.error("Error fetching pending papers:", error);
    return [];
  }
}
