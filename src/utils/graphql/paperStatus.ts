
import { gql } from '@apollo/client';
import { client } from './client';

// Helper function to get paper status from events
export async function getPaperStatus(paperId: string) {
  try {
    // Check if paper is approved
    const approvedResult = await client.query({
      query: gql`
        query {
          paperApproveds(where: {paperId: "${paperId}"}) {
            id
          }
        }
      `
    });
    
    if (approvedResult.data.paperApproveds.length > 0) return 1; // PUBLISHED
    
    // Check if paper is rejected
    const rejectedResult = await client.query({
      query: gql`
        query {
          paperRejecteds(where: {paperId: "${paperId}"}) {
            id
          }
        }
      `
    });
    
    if (rejectedResult.data.paperRejecteds.length > 0) return 2; // REJECTED
    
    // Check if paper is removed
    const removedResult = await client.query({
      query: gql`
        query {
          paperRemoveds(where: {paperId: "${paperId}"}) {
            id
          }
        }
      `
    });
    
    if (removedResult.data.paperRemoveds.length > 0) return 3; // REMOVED
    
    return 0; // Default to PENDING
  } catch (error) {
    console.error("Error checking paper status:", error);
    return 0; // Default to PENDING
  }
}
