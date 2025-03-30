
import { gql } from '@apollo/client';
import { client } from './client';
import { getContractReadOnly } from '../contract';

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
