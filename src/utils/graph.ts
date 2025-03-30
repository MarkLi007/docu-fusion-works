
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { getContractReadOnly } from './contract';

// Create a client for The Graph API
const client = new ApolloClient({
  uri: ' https://api.studio.thegraph.com/query/107809/paperregistryadvancedmultiauditorplus/v0.0.1', 
  cache: new InMemoryCache(),
});

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

// Helper function to get paper status from events
async function getPaperStatus(paperId: string) {
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

// Query to search papers by keyword using the subgraph
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

// Query to get papers by owner address
export async function getPapersByOwner(ownerAddress: string) {
  try {
    const contract = await getContractReadOnly();
    const paperCount = Number(await contract.paperCount());
    const papers = [];
    
    // We need to check each paper in the contract since the subgraph doesn't index paper owners
    for (let i = 1; i <= paperCount; i++) {
      try {
        const [owner, title, author, status, versionCount] = await contract.getPaperInfo(i);
        
        if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
          // Get paper details from subgraph for more data
          const { data } = await client.query({
            query: gql`
              query {
                paperSubmitteds(where: {paperId: "${i}"}) {
                  paperId
                  title
                  author
                  ipfsHash
                  timestamp
                }
                versionAddeds(where: {paperId: "${i}"}, orderBy: versionIndex) {
                  versionIndex
                  ipfsHash
                  timestamp
                }
              }
            `
          });
          
          const paperSubmit = data.paperSubmitteds[0];
          
          // Collect all versions
          const versions = data.versionAddeds.map((ver: any) => ({
            versionIndex: Number(ver.versionIndex),
            ipfsHash: ver.ipfsHash,
            timestamp: ver.timestamp
          }));
          
          // Add the paper to results
          papers.push({
            id: i.toString(),
            title,
            author,
            status: Number(status),
            timestamp: paperSubmit ? paperSubmit.timestamp : "0",
            versions: versions.length > 0 ? versions : [{
              versionIndex: 0,
              ipfsHash: paperSubmit ? paperSubmit.ipfsHash : "",
              timestamp: paperSubmit ? paperSubmit.timestamp : "0"
            }]
          });
        }
      } catch (error) {
        console.error(`Error fetching paper ${i}:`, error);
      }
    }
    
    return papers;
  } catch (error) {
    console.error("Error fetching papers by owner:", error);
    return [];
  }
}

// Query to get a specific paper by ID
export async function getPaperById(paperId: string) {
  try {
    // Get paper submission data
    const { data: paperData } = await client.query({
      query: gql`
        query {
          paperSubmitteds(where: {paperId: "${paperId}"}) {
            paperId
            title
            author
            ipfsHash
            timestamp
            signature
          }
          versionAddeds(where: {paperId: "${paperId}"}, orderBy: versionIndex) {
            versionIndex
            ipfsHash
            timestamp
            signature
            references
          }
        }
      `
    });
    
    if (!paperData.paperSubmitteds.length) {
      console.log("Paper not found in subgraph, trying contract...");
      
      // If not in subgraph, try contract
      const contract = await getContractReadOnly();
      const [owner, title, author, status, versionCount] = await contract.getPaperInfo(paperId);
      
      if (Number(status) >= 0) {
        // Get version info 
        const versions = [];
        for (let i = 0; i < Number(versionCount); i++) {
          const [ipfsHash, fileHash, timestamp, signature, references] = await contract.getVersion(paperId, i);
          versions.push({
            id: `${paperId}-${i}`,
            versionIndex: i,
            ipfsHash,
            timestamp: timestamp.toString(),
            signature,
            references
          });
        }
        
        return {
          id: paperId,
          owner,
          title,
          author,
          status: Number(status),
          timestamp: versions[0].timestamp,
          versions
        };
      }
      
      return null;
    }
    
    const paper = paperData.paperSubmitteds[0];
    const paperStatus = await getPaperStatus(paperId);
    
    // Format versions - if we have additional versions, use those, otherwise use the submission version
    let versions = [];
    if (paperData.versionAddeds.length > 0) {
      versions = paperData.versionAddeds.map((ver: any, index: number) => ({
        id: `${paperId}-${index + 1}`,
        versionIndex: Number(ver.versionIndex),
        ipfsHash: ver.ipfsHash,
        timestamp: ver.timestamp,
        signature: ver.signature,
        references: ver.references
      }));
    }
    
    // Add the initial version (from paper submission)
    versions.unshift({
      id: `${paperId}-0`,
      versionIndex: 0,
      ipfsHash: paper.ipfsHash,
      timestamp: paper.timestamp,
      signature: paper.signature,
      references: []  // Initial version references may not be tracked in your subgraph
    });
    
    // Get owner from contract (not in subgraph)
    const contract = await getContractReadOnly();
    const [owner] = await contract.getPaperInfo(paperId);
    
    return {
      id: paperId,
      title: paper.title,
      author: paper.author,
      status: paperStatus,
      timestamp: paper.timestamp,
      owner,
      versions
    };
  } catch (error) {
    console.error("Error fetching paper by ID:", error);
    return null;
  }
}
