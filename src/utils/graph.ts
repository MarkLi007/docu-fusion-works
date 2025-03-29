
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

// Create a client for The Graph API
const client = new ApolloClient({
  uri: 'https://api.thegraph.com/subgraphs/name/yoursubgraph/paper-registry', // Replace with your actual subgraph URL
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

// Query to search papers by keyword
export async function searchPapers(keyword: string, searchField: string) {
  let fieldCondition = '';
  
  if (keyword) {
    if (searchField === 'title') {
      fieldCondition = `where: { title_contains_nocase: "${keyword}" }`;
    } else if (searchField === 'author') {
      fieldCondition = `where: { author_contains_nocase: "${keyword}" }`;
    } else if (searchField === 'id') {
      fieldCondition = `where: { id: "${keyword}" }`;
    }
  }

  const { data } = await client.query({
    query: gql`
      query {
        papers(
          first: 100, 
          orderBy: timestamp, 
          orderDirection: desc,
          ${fieldCondition}
          where: { status: 1 }  # Only published papers (status = 1)
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

  return data.papers;
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
