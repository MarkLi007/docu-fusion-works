import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import { getContractReadOnly } from './contract';

// Create a client for The Graph API
const client = new ApolloClient({
  uri: ' https://api.studio.thegraph.com/query/107809/paperregistryadvancedmultiauditorplus/v0.0.1', // Replace subgraph URL
  cache: new InMemoryCache(),
});

// Query to get all papers
export async function getAllPapers() {
  const { data } = await client.query({
    query: gql`
      query {
        papers(first: 100, orderBy: timestamp, orderDirection: desc) {
          id
          title
          author
          status
          timestamp
          owner
          versions {
            id
            versionIndex
            ipfsHash
            timestamp
            signature
          }
        }
      }
    `
  });

  return data.papers;
}

// Query to search papers by keyword using the subgraph
export async function searchPapersGraph(keyword: string, searchField: string) {
  let fieldCondition = '';
  
  if (keyword) {
    if (searchField === 'title') {
      fieldCondition = `where: { title_contains_nocase: "${keyword}", status: 1 }`;
    } else if (searchField === 'author') {
      fieldCondition = `where: { author_contains_nocase: "${keyword}", status: 1 }`;
    } else {
      // Default - we'll handle ID search separately
      fieldCondition = `where: { status: 1 }`;
    }
  } else {
    fieldCondition = `where: { status: 1 }`;
  }

  const { data } = await client.query({
    query: gql`
      query {
        papers(
          first: 100, 
          orderBy: timestamp, 
          orderDirection: desc,
          ${fieldCondition}
        ) {
          id
          title
          author
          status
          timestamp
          owner
          versions {
            id
            versionIndex
            ipfsHash
            timestamp
          }
        }
      }
    `
  });

  console.log("Graph search results:", data.papers);
  return data.papers;
}

// Query paper by ID directly from the contract
export async function searchPaperById(paperId: string) {
  try {
    console.log("Searching for paper ID:", paperId);
    
    // Try to get paper by ID from subgraph first
    const { data } = await client.query({
      query: gql`
        query {
          paper(id: "${paperId}") {
            id
            title
            author
            status
            timestamp
            owner
            versions {
              id
              versionIndex
              ipfsHash
              timestamp
            }
          }
        }
      `
    });
    
    if (data && data.paper) {
      console.log("Found paper in subgraph:", data.paper);
      // Return as array to match the format expected by the component
      return [data.paper];
    }
    
    // If not found in subgraph, try direct contract call
    console.log("Paper not found in subgraph, trying contract...");
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
  const { data } = await client.query({
    query: gql`
      query {
        papers(
          first: 100, 
          orderBy: timestamp, 
          orderDirection: desc, 
          where: { status: 0 }  # Only pending papers (status = 0)
        ) {
          id
          title
          author
          status
          timestamp
          owner
          versions(first: 1) {
            ipfsHash
            timestamp
          }
        }
      }
    `
  });
  
  return data.papers.map((paper: any) => ({
    paperId: Number(paper.id),
    owner: paper.owner,
    title: paper.title,
    author: paper.author,
    timestamp: Number(paper.timestamp),
    ipfsHash: paper.versions[0]?.ipfsHash || "",
  }));
}

// Query to get papers by owner address
export async function getPapersByOwner(ownerAddress: string) {
  const { data } = await client.query({
    query: gql`
      query {
        papers(
          first: 100, 
          orderBy: timestamp, 
          orderDirection: desc, 
          where: { owner: "${ownerAddress.toLowerCase()}" }
        ) {
          id
          title
          author
          status
          timestamp
          versions {
            versionIndex
            ipfsHash
            timestamp
          }
        }
      }
    `
  });
  
  return data.papers;
}

// Query to get a specific paper by ID
export async function getPaperById(paperId: string) {
  const { data } = await client.query({
    query: gql`
      query {
        paper(id: "${paperId}") {
          id
          title
          author
          status
          timestamp
          owner
          versions(orderBy: versionIndex) {
            id
            versionIndex
            ipfsHash
            timestamp
            signature
            references
          }
        }
      }
    `
  });
  
  return data.paper;
}
