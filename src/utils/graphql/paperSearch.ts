
import { gql } from '@apollo/client';
import { client } from './client';
import { getPaperStatus } from './paperStatus';
import { getContractReadOnly } from '../contract';

// Search papers by keyword using the subgraph
export async function searchPapersGraph(keyword: string, searchField: string) {
  try {
    console.log("Searching graph with:", { keyword, searchField });
    let fieldCondition = '';
    
    if (keyword) {
      if (searchField === 'title') {
        fieldCondition = `where: { title_contains_nocase: "${keyword}" }`;
      } else if (searchField === 'author') {
        fieldCondition = `where: { author_contains_nocase: "${keyword}" }`;
      }
    }

    const { data } = await client.query({
      query: gql`
        query {
          paperSubmitteds(
            first: 100, 
            orderBy: timestamp, 
            orderDirection: desc,
            ${fieldCondition}
          ) {
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

    console.log("Graph search results:", data.paperSubmitteds);
    
    // Process results to add status and format them correctly
    const formattedResults = await Promise.all(
      data.paperSubmitteds.map(async (paper: any) => {
        const paperStatus = await getPaperStatus(paper.paperId.toString());
        
        // Only include published papers for regular search
        if (searchField !== 'id' && paperStatus !== 1) {
          return null;
        }
        
        return {
          id: paper.paperId.toString(),
          title: paper.title,
          author: paper.author,
          status: paperStatus,
          timestamp: paper.timestamp,
          owner: "", // Would need to be filled via contract call
          versions: [
            {
              versionIndex: 0,
              ipfsHash: paper.ipfsHash,
              timestamp: paper.timestamp
            }
          ]
        };
      })
    );
    
    // Filter out null entries (non-published papers)
    return formattedResults.filter(paper => paper !== null);
  } catch (error) {
    console.error("Error searching papers in graph:", error);
    return [];
  }
}

// Query paper by ID directly from the contract - kept as fallback
export async function searchPaperById(paperId: string) {
  try {
    console.log("Searching for paper ID:", paperId);
    
    // Try to get paper by ID from subgraph first
    const { data } = await client.query({
      query: gql`
        query {
          paperSubmitteds(where: {paperId: "${paperId}"}) {
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
    
    console.log("Subgraph paper ID search results:", data.paperSubmitteds);
    
    if (data && data.paperSubmitteds.length > 0) {
      const paper = data.paperSubmitteds[0];
      const paperStatus = await getPaperStatus(paper.paperId.toString());
      
      console.log("Found paper in subgraph:", paper);
      
      // Get additional versions if any
      const versionsResult = await client.query({
        query: gql`
          query {
            versionAddeds(where: {paperId: "${paperId}"}, orderBy: versionIndex) {
              versionIndex
              ipfsHash
              timestamp
            }
          }
        `
      });
      
      const versions = versionsResult.data.versionAddeds.map((ver: any) => ({
        versionIndex: Number(ver.versionIndex),
        ipfsHash: ver.ipfsHash,
        timestamp: ver.timestamp
      }));
      
      // If no additional versions found, use the initial version from the paper submission
      const paperVersions = versions.length > 0 ? versions : [{
        versionIndex: 0,
        ipfsHash: paper.ipfsHash,
        timestamp: paper.timestamp
      }];
      
      return [{
        id: paper.paperId.toString(),
        title: paper.title,
        author: paper.author,
        status: paperStatus,
        timestamp: paper.timestamp,
        owner: "", // Would need separate query to get this
        versions: paperVersions
      }];
    }
    
    console.log("Paper not found in subgraph, trying contract...");
    
    // If not found in subgraph, try direct contract call
    const contract = await getContractReadOnly();
    const [owner, title, author, status, versionCount] = await contract.getPaperInfo(paperId);
    
    // Check if the paper exists (valid status)
    if (Number(status) >= 0) {
      console.log("Found paper in contract:", { owner, title, author, status });
      const [ipfsHash, fileHash, timestamp] = await contract.getVersion(paperId, 0);
      
      return [{
        id: paperId,
        owner,
        title,
        author,
        status: Number(status),
        timestamp: timestamp.toString(),
        versions: [{
          versionIndex: 0,
          ipfsHash,
          timestamp: timestamp.toString()
        }]
      }];
    }
    
    console.log("Paper not found in contract");
    return [];
  } catch (error) {
    console.error("Error fetching paper by ID:", error);
    return [];
  }
}

// Combined search function
export async function searchPapers(keyword: string, searchField: string) {
  console.log("Search function called with:", { keyword, searchField });
  
  if (searchField === 'id' && keyword) {
    return searchPaperById(keyword);
  } else {
    return searchPapersGraph(keyword, searchField);
  }
}
