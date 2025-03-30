
import { gql } from '@apollo/client';
import { client } from './client';
import { getPaperStatus } from './paperStatus';
import { getContractReadOnly } from '../contract';

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
